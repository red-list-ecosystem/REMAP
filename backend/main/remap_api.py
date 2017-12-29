import config
import ee
import json
import remap
from datastore import *
from shared import *
import logging


class GetMapData(BaseHandler):
    layers = []

    def dispatch(self):
        self.layers = []
        try:
            self.data = json.loads(self.request.body)
        except:
            self.data = json.loads(self.request.get('data'))

        self.region = self.get_region(self.data)

        self.response.headers['Content-Type'] = 'application/json'
        if 'predictors' in self.data:
            self.predictors = self.data['predictors']
        if 'predictor' in self.data:
            self.predictor = self.data['predictor']

        if 'sigma' in self.data:
            self.sigma = self.data['sigma']

        if 'past' in self.data:
            self.past = self.data['past']

        # We are doing something that invovles a classification:
        if 'classList' in self.data:
            self.classes = self.data['classList']

            if self.min_points(self.classes):
                self.response.set_status(422)
                self.response.write(json.dumps({
                    "message": "The number of points per class is too low."
                }))
                return
            if self.too_many_points(self.classes):
                logging.error('Too many traning points, requested points: %d.' % sum(
                    [len(label['points']) for label in classes]))
                self.response.set_status(422)
                self.response.write(json.dumps({
                    "message": "The total number of training points cannot exceed %s." % config.MAX_POINTS
                }))
                return

            self.train_fc = self.get_train(self.classes)
            # todo set this up with memcache

            area = self.region.area().getInfo() / 1e6
            if area > config.AREA_THRESHOLD:
                logging.error(
                    'region size exceeded size, requested size: %.3f.' % area)
                self.response.set_status(422)
                self.response.write(json.dumps({
                    "message": "The area of the region exceeds %s km^2, Area of region: %.3f km^2" % (config.AREA_THRESHOLD, area)
                }))
                return
        super(GetMapData, self).dispatch()

    def add_layer(self, lay, opt, name):
        m = lay.getMapId(opt)
        self.layers.append({
            'mapid': m['mapid'],
            'label': name,
            'token': m['token']
        })

    def min_points(self, classes):
        """ We require at least 1 point per class
        """
        return min([len(label['points']) for label in classes]) < 1

    def too_many_points(self, classes):
        """ This is so the 
        """
        return sum([len(label['points']) for label in classes]) > config.MAX_POINTS

    def get_train(self, classes):
        for label in classes:
            label['fc'] = ee.FeatureCollection([
                ee.Feature(
                    ee.Geometry.Point([p['lng'], p['lat']]),
                ).set('label', label['lab'])
                for p in label['points']
            ])
        return ee.FeatureCollection([lab['fc'] for lab in classes]).flatten()

    def get_region(self, data):
        region_path = data['region']
        return ee.Algorithms.GeometryConstructors.Polygon([
            [x['lng'], x['lat']]
            for x in region_path
        ])

    def post(self):
        """ Receives the training data and returns a classified raster.
        """
        # log points information about the classification:
        datastore(self.request.remote_addr,
                  self.request.headers.get('User-Agent'),
                  sum([len(label['points']) for label in self.classes]),
                  len(self.classes),
                  False,
                  json.dumps(self.data['region']))

        classified = remap.get_classified_from_fc(
            self.train_fc, self.predictors, self.past).clip(self.region)

        self.add_layer(classified, self.get_vis(
            self.classes), "Classified Map")
        self.response.write(json.dumps(self.layers))

    def get_vis(self, classes):
        return {
            'min': 1,
            'max': len(classes),
            'palette': ",".join(
                [label['colour'] for label in classes]
            )
        }


class GetPerformance(GetMapData):
    def post(self):
        cm = remap.get_perf_from_fc(self.train_fc, self.predictors, self.past)
        resp = {
            #'cm': cm.getInfo(),
            'accuracy': cm.accuracy().getInfo(),
            'consumers_accuracy': cm.consumersAccuracy().getInfo(),
            'producers_accuracy': cm.producersAccuracy().getInfo()
        }
        return self.response.write(json.dumps(resp))


class GetPredictorLayer(GetMapData):
    def post(self):
        chosen = self.predictor
        # vis parameters for ls8 and ls7
        nvis = {'bands': 'Red, Green, Blue', 'min': 0, 'max': 128}
        nvis_past = {'bands': 'Red, Green, Blue',
                     'min': 10, 'max': "110,106,120", 'gamma': 0.8}
        if chosen in remap.predictor_dict:
            # set the default colour ramp
            if 'ramp' in remap.predictor_dict[chosen]:
                ramp = remap.predictor_dict[chosen]['ramp']
            else:
                ramp = config.DEFAULT_COLOUR_RAMP
            img = remap.base_predictor_layer(self.past).select([chosen])
            name = remap.predictor_dict[chosen]['long_name']
            if 'mean' not in self.data:
                sigma = self.data['sigma']
                vis, mean, total_sd = self.get_vis(
                    self.region, sigma, chosen, img)
                vis['palette'] = ramp
            else:
                mean = self.data['mean']
                sigma = self.data['sigma']
                total_sd = self.data['total_sd']
                vis = {
                    'min': mean - sigma * total_sd,
                    'max': mean + sigma * total_sd,
                    'palette': ramp
                }
        elif chosen == 'natural':
            img = remap.base_predictor_layer(
                self.past).select(['Red', 'Green', 'Blue'])
            name = "Natural"
            if(self.past):
                vis = nvis_past
            else:
                vis = nvis
            mean, total_sd = 0, 1  # default values for mean and total sd
        else:
            return self.response.write(json.dumps({'message': 'Predictor not found'}))

        m = img.getMapId(vis)
        response = {
            'label': name,
            'mapid': m['mapid'],
            'token': m['token'],
            'mean': mean,
            'total_sd': total_sd
        }
        return self.response.write(json.dumps(response))

    def get_vis(self, region, sigma, chosen, img):
        # get the bounds
        points = ee.FeatureCollection.randomPoints(
            region, remap.parameters['pred_vis_points'])
        vals = img.rename([chosen]).clip(region).sampleRegions(points, scale=1)
        stats = vals.aggregate_stats(chosen).getInfo()['values']
        return {
            'min': stats['mean'] - sigma * stats['total_sd'],
            'max': stats['mean'] + sigma * stats['total_sd'],
        }, stats['mean'], stats['total_sd']


class AOO(GetMapData):
    def post(self):
        selected = int(self.data['selected'])
        label = selected + 1
        interest = remap.get_classified_from_fc(
            self.train_fc, self.predictors, self.past).clip(self.region)
        interest = ee.Image(0).where(interest.eq(label), 1).clip(self.region)

        results = remap.aoo(interest, self.region)

        results['selected'] = selected

        return self.response.write(json.dumps(results))


class EOO(GetMapData):
    def post(self):
        selected = int(self.data['selected'])
        label = selected + 1
        interest = remap.get_classified_from_fc(
            self.train_fc, self.predictors, self.past).clip(self.region)
        interest = ee.Image(0).where(interest.eq(label), 1).clip(self.region)
        results = remap.eoo(interest, self.region)

        results['selected'] = selected

        return self.response.write(json.dumps(results))


class GetHistData(GetMapData):
    def post(self):
        train_fc = self.get_train(self.classes)
        classified = remap.get_classified_from_fc(
            self.train_fc, self.predictors, self.past).clip(self.region)

        hist_data = classified.addBands(ee.Image.pixelArea()).reduceRegion(
            reducer=ee.Reducer.sum().unweighted().forEachBand(classified).group(
                groupField=0,
                groupName="class"),
            geometry=self.region,
            # enable , if getting errors about maximum number of pixels
            scale=remap.parameters['histogram_scale'],
            maxPixels=5000000000).getInfo()
        self.response.write(json.dumps(hist_data))
