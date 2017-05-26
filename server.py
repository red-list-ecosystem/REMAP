import os, sys, json, time, uuid
sys.path.append('lib') # lib to the path
import remap, config
from lib import drive
from googleapiclient.discovery import build
from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from webapp2_extras import sessions
import webapp2, jinja2
import ee, oauth2client, httplib2

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

APP_CREDENTIALS = oauth2client.client.SignedJwtAssertionCredentials(
	config.EE_ACCOUNT,
	open(config.EE_PRIVATE_KEY_FILE, 'rb').read(),
	scope='https://www.googleapis.com/auth/drive')
APP_DRIVE_HELPER = drive.DriveHelper(APP_CREDENTIALS)

flow = oauth2client.client.flow_from_clientsecrets(
	'client_secrets.json',
	scope='https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
	redirect_uri='https://remap-162804.appspot.com/oauth2callback')
flow.params['access_type'] = 'offline'
wsgiConfig = {}
wsgiConfig['webapp2_extras.sessions'] = {
	'secret_key': config.WSGI_KEY
}

classifyProgress = 'NOT_STARTED'
exportProgress = 'NOT_STARTED'

class Query(ndb.Model):
	ipAddress = ndb.StringProperty()
	nPoints = ndb.IntegerProperty()
	nClasses = ndb.IntegerProperty()
	region = ndb.StringProperty()
	isDrive = ndb.BooleanProperty()
	date = ndb.DateTimeProperty(auto_now_add=True)

def kmlify(rgn):
	rgnString = ''
	rgn = json.loads(rgn)
	for idx,r in enumerate(rgn):
		if idx != 0:
			rgnString += ' '
		rgnString += str(r['lng']) + ',' + str(r['lat']) + ',0'
	return '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + rgnString + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'

def datastore(ip, nPts, nCls, isDrv, rgn):
	q = Query(ipAddress=ip, nPoints=nPts, nClasses=nCls, isDrive=isDrv, region=kmlify(rgn))
	q.put()

class BaseHandler(webapp2.RequestHandler):
	def dispatch(self):
		self.session_store = sessions.get_store(request=self.request)
		try:
			webapp2.RequestHandler.dispatch(self)
		finally:
			self.session_store.save_sessions(self.response)

	@webapp2.cached_property
	def session(self):
		return self.session_store.get_session()

class MainPage(BaseHandler):
	def get(self):
		if 'credentials' in self.session:
			credentials = oauth2client.client.OAuth2Credentials.from_json(self.session['credentials'])
			if credentials.access_token_expired:
				self.session.pop('credentials', None)
		template = jinja_environment.get_template('templates/index.html')
		oauthResponse = 'true' if 'credentials' in self.session else ('reload' if 'reload' in self.session else 'false')
		self.session.pop('reload', None)
		self.response.out.write(template.render({
			'predictors': remap.predictors,
			'oauth_url': flow.step1_get_authorize_url(), # is this fine to return when the user is already signed in?
			'oauth': oauthResponse,
			'DEBUG': config.DEBUG
		}))

class OAuth(BaseHandler):
	def get(self):
		code = self.request.get('code')
		if code != '':
			credentials = flow.step2_exchange(self.request.get('code'))
			http = credentials.authorize(httplib2.Http())
			# surely there's an easier way to get the email?
			ui = build('plus', 'v1', http=http)
			userinfo = ui.people().get(userId='me').execute(http=http)
			self.session['email'] = userinfo['emails'][0]['value'] # maybe not 0? how do we determine which is the right email address
			self.session['user_id'] = userinfo['id']
			self.session['credentials'] = credentials.to_json()
		else:
			self.session['reload'] = True
		self.redirect('/')

class Home(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/home.html')
		self.response.out.write(template.render())

class About(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/about.html')
		self.response.out.write(template.render())

class Methods(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/methods.html')
		self.response.out.write(template.render({'predictors': remap.predictors}))

class GetMapData(BaseHandler):
	layers = []
	def get(self):
		self.response.set_status(404)
		self.response.write(json.dumps({
			'message':'Page not found.'
		}))

	def add_layer(self, lay, opt, name):
		m = lay.getMapId(opt)
		self.layers.append({
			'mapid': m['mapid'],
			'label': name,
			'token': m['token']
		})

	def min_points(self, classes):
		return min([ len( label['points'] ) for label in classes ]) < 1
	
	def too_many_points(self, classes):
		return sum([ len( label['points'] ) for label in classes ]) > config.MAX_POINTS

	def area_threshold_exceeded(self, region):
		return region.area().getInfo()/1e6 > config.AREA_THRESHOLD

	def get_train(self, classes):
		for label in classes:
			label['fc'] = ee.FeatureCollection([
				ee.Feature(
					ee.Geometry.Point([p['lng'],p['lat']]),
				).set('label', label['lab'])
				for p in label['points']
			])
		return ee.FeatureCollection([ lab['fc'] for lab in classes]).flatten()

	def get_region(self, data):
		region_path = data['region']
		return ee.Algorithms.GeometryConstructors.Polygon([
			[x['lng'], x['lat']]
			for x in region_path 
		])

	def post(self):
		""" Receives the training data and returns a classified raster.
		"""
		self.layers = []
		self.response.headers['Content-Type'] = 'application/json'

		data = json.loads(self.request.body)

		predictors = data['predictors']
		classes = data['classList']

		if self.min_points(classes):
			self.response.set_status(500)
			self.response.write(json.dumps({
				"message": "The number of points per class is too low."
			}))
			return
		if self.too_many_points(classes):
			self.response.set_status(500)
			self.response.write(json.dumps({
				"message": "The total number of training points cannot exceed %s." % config.MAX_POINTS
			}))
			return

		train_fc = self.get_train(classes)
		region_fc = self.get_region(data)

		if self.area_threshold_exceeded(region_fc):
			self.response.set_status(500)
			self.response.write(json.dumps({
				"message": "The area of the region exceeds %s km^2, Area of region: %.3f km^2" % (
					config.AREA_THRESHOLD, region_fc.area().getInfo()/1e6 )
			}))
			return

		datastore(self.request.remote_addr, sum([ len( label['points'] ) for label in classes ]), len(classes), False, json.dumps(data['region']))
		classified = remap.get_classified_from_fc(train_fc, predictors).clip(region_fc)

		self.add_layer(classified, self.get_vis(classes), "Classified image")
		self.response.write(json.dumps(self.layers))

	def get_vis(self, classes):
		return {
			'min': 1,
			'max': len(classes),
			'palette': ",".join(
				[ label['colour'] for label in classes ]
			)
		}

class GetPerformance(GetMapData):
	def post(self):
		self.response.headers['Content-Type'] = 'application/json'
		data = json.loads(self.request.body)
		predictors = data['predictors']
		classes = data['classList']

		if self.min_points(classes):
			return 

		train_fc = self.get_train(classes)
		region_fc = self.get_region(data)
		cm = remap.get_perf_from_fc(train_fc, predictors)
		resp = {
			#'cm': cm.getInfo(),
			'accuracy':cm.accuracy().getInfo(),
			'consumers_accuracy':cm.consumersAccuracy().getInfo(),
			'producers_accuracy':cm.producersAccuracy().getInfo()
		}
		return self.response.write(json.dumps(resp))

class GetPredictorLayer(GetMapData):
	def post(self):
		self.response.headers['Content-Type'] = 'application/json'
		data = json.loads(self.request.body)
		chosen = data['predictor']
		if chosen in remap.predictor_dict:
			ramp = config.DEFAULT_COLOUR_RAMP
			if 'ramp' in remap.predictor_dict[chosen]:
				ramp = remap.predictor_dict[chosen]['ramp']
			img = remap.base_predictor_layer().select([chosen])
			region = self.get_region(data)
			sigma = data['sigma']
			name =  remap.predictor_dict[chosen]['long_name']
			if 'mean' not in data:
				vis, mean, total_sd = self.get_vis(region, sigma, chosen, img)
				vis['palette'] = ramp
			else:
				mean = data['mean']
				total_sd = data['total_sd']
				vis = {
					'min': mean - sigma * total_sd,
					'max': mean + sigma * total_sd,
					'palette': ramp
				}
		elif chosen == 'natural':
			name = "Natural"
			region = self.get_region(data)
			sigma = data['sigma']
			img = remap.base_predictor_layer().select(['Red', 'Green', 'Blue'])
			vis = {'bands': 'Red, Green, Blue', 'min': 0, 'max':'2200, 2000, 2000'}
			mean, total_sd = 0, 1 # default values for mean and total sd
		else:
			return self.response.write(json.dumps({'message': 'predictor not found'}))
		
		m = img.getMapId(vis)
		response = {
			'label':name,
			'mapid': m['mapid'],
			'token': m['token'],
			'mean': mean,
			'total_sd': total_sd
		}
		return self.response.write(json.dumps(response))

	def get_vis(self, region, sigma, chosen, img):
		# get the bounds
		points = ee.FeatureCollection.randomPoints(region, remap.parameters['pred_vis_points'])
		vals = img.rename([chosen]).clip(region).sampleRegions(points, scale=1)
		stats = vals.aggregate_stats(chosen).getInfo()['values']
		return {
			'min': stats['mean'] - sigma * stats['total_sd'],
			'max': stats['mean'] + sigma * stats['total_sd'],
		}, stats['mean'], stats['total_sd']

class Assessment(GetMapData):
	def post(self):
		self.response.headers['Content-Type'] = 'application/json'
		data = json.loads(self.request.body)
		predictors = data['predictors']
		classes = data['classList']
		selected = int(data['selected'])
		if self.min_points(classes):
			return
		train_fc = self.get_train(classes)
		region_fc = self.get_region(data)
		interest = remap.get_classified_from_fc(train_fc, predictors).clip(region_fc)
		interest = interest.updateMask(interest.eq(selected))
		results = {}
		results['selected'] = selected
		class_poly = interest.reduceToVectors(
  			scale=config.ASSESSMENT_REDUCE_SCALE, 
  			geometryType='polygon',
  			#bestEffort=True # best effort might make this not accurate
		)
		results['area'] = class_poly.geometry().area(maxError=1).getInfo()
		# additionally here with max error might make this not accurate
		results['eoo'] = class_poly.geometry().convexHull(maxError=1).area().getInfo()
		results['units'] = 'm^2'

		return self.response.write(json.dumps(results))

class GetHistData(GetMapData):
	def post(self):
		self.response.headers['Content-Type'] = 'application/json'
		data = json.loads(self.request.body)
		predictors = data['predictors']
		classes = data['classList']
		if self.min_points(classes):
			return
		train_fc = self.get_train(classes)
		region_fc = self.get_region(data)
		classified = remap.get_classified_from_fc(train_fc, predictors).clip(region_fc)
		hist_data = classified.reduceRegion(
			ee.Reducer.frequencyHistogram(),
			region_fc, 
			# enable , if getting errors about maximum number of pixels
			scale=remap.parameters['histogram_scale'],
			bestEffort=remap.parameters['best_effort']).getInfo()
		self.response.write(json.dumps(hist_data))

class Logout(BaseHandler):
	def post(self):
		self.session.pop('email', None)
		self.session.pop('user_id', None)
		self.session.pop('credentials', None)
		self.redirect('/')

class Export(BaseHandler):
	"""Allows for the exporting of a classified region as a geotiff to a users 
		Google Drive.
	"""
	def get(self):
		self.response.write(exportProgress)

	def post(self):
		global exportProgress
		exportProgress = 'IN_PROGRESS'
		taskqueue.add(
			url = '/exportworker',
			params = {
				'data': self.request.body,
				'ip': self.request.remote_addr,
				'credentials': self.session['credentials'],
				'email': self.session['email']
			})
		self.response.write(json.dumps({}))

class ExportWorker(GetMapData):
	def post(self):
		global exportProgress
		self.layers = []
		self.response.headers['Content-Type'] = 'application/json'

		data = json.loads(self.request.get('data'))
		predictors = data['predictors']
		classes = data['classList']

		if self.min_points(classes):
			return
		# build the metadata file
		header = ['Class, GeoTIFF Value']
		meta_list = header + [
			"%s, %s" % (c['name'] , i + 1) for i, c  in enumerate(classes)]
		meta_list.append('missing_data, 0')
		meta_list.append('pixel_scale_m, ' + str(config.EXPORT_TIFF_SCALE))
		meta_file = '\n'.join(meta_list)

		train_fc = self.get_train(classes)
		region_fc = self.get_region(data)
		datastore(self.request.get('ip'), sum([ len( label['points'] ) for label in classes ]), len(classes), True, json.dumps(data['region']))
		classified = remap.get_classified_from_fc(train_fc, predictors).clip(region_fc)
		temp_file_prefix = str(uuid.uuid4())
		file_name = 'REMAP GeoTIFF Export ' + time.ctime() + '.tif'

		task = ee.batch.Export.image(
			image=classified,
			description=file_name,
			config={
				'driveFileNamePrefix': temp_file_prefix,
				'maxPixels': 1e10,
				'scale': config.EXPORT_TIFF_SCALE,
				'region': json.dumps([[x['lng'], x['lat']] for x in data['region']])
			})
		# Kangaroo Island CSV points
		# scale 30 took 1335.49342012 seconds (22 mins)
		# scale 100 took 177.377995968 seconds (3 mins)

		task.start()
		while task.active():
			time.sleep(10)

		state = task.status()['state']
		if state == ee.batch.Task.State.COMPLETED:
			print('Done, Copying ...')

			files = APP_DRIVE_HELPER.GetExportedFiles(temp_file_prefix)
			credentials = oauth2client.client.OAuth2Credentials.from_json(self.request.get('credentials'))
			for f in files:
				APP_DRIVE_HELPER.GrantAccess(f['id'], self.request.get('email'))
			user_drive_helper = drive.DriveHelper(credentials)
			# TODO why are these two cases needed shouldnt the else cover the first case
			# TODO upload the metadata file.
			if len(files) == 1:
				file_id = files[0]['id']
				copied_file_id = user_drive_helper.CopyFile(file_id, file_name)
			else:
				for f in files:
					user_drive_helper.CopyFile(f['id'], file_name)
			for f in files:
				APP_DRIVE_HELPER.DeleteFile(f['id'])
			# writing a response is necessary so the Javascript doesnt error (yes, even on 200 OK responses)
			exportProgress = 'COMPLETED'
			print('Done!')
		else:
			exportProgress = 'ERROR'
			print('Error')

def handle_error(request, response, exception):
	""" Sends the error for post requests back to the client in json format
	"""
	if request.method == "POST":
		response.headers.add_header('Content-Type', 'application/json')
		result = {
			'status': 'error',
			'message': exception.message,
		}
		response.write(json.dumps(result))
	else:
		response.write(exception)
	response.set_status(500)

app = webapp2.WSGIApplication([
	## app endpoints
	('/', MainPage),
	('/getmapdata', GetMapData),
	('/getperformance', GetPerformance),
	('/getassessment', Assessment),
	('/gethistdata', GetHistData),
	('/getpredictorlayer', GetPredictorLayer),
	('/oauth2callback', OAuth),
	('/logout', Logout),
	('/export', Export),
	('/exportworker', ExportWorker),
	## website endpoints
	('/home', Home),
	('/methods', Methods),
	('/about', About)
], debug=config.DEBUG, config=wsgiConfig)
app.error_handlers[500] = handle_error
