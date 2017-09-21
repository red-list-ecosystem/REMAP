import ee
from parameters import *
from predictor_image import *
import math, logging

ASSESSMENT_REDUCE_SCALE = 1e2
ASSESSMENT_UNIT = "km Squared"
ASSESSMENT_SCALE = 1e6 # ee returns meters by default so we want 
ASSESSMENT_MAX_ERROR = 1
ASSESSMENT_AOO_BUFFER = 10000 # old 
ASSESSMENT_BEST_EFFORT = True

def assessment(interest, region):
	""" itnerest is a clipped image where the ecosystem of interest is 1 else 0
			region is the region enclosing the ecosystem.
	"""
	results = {}

	results['eoo'] = eoo(interest, region)
	results['aoo'], results['aoo_1pc'], results['grids'], results['area'] = aoo_area(interest, region)
	results['units'] = ASSESSMENT_UNIT

	return results

# Takes a feature collection of your class and returns its Extent of Occurance in meters squared.
def eoo(interest, region):
	class_poly = interest.updateMask(1).reduceToVectors(
		scale=ASSESSMENT_REDUCE_SCALE, 
		geometryType='polygon',
		bestEffort=ASSESSMENT_BEST_EFFORT # best effort might make this less not accurate
	)
	return class_poly.geometry().convexHull(
		maxError=ASSESSMENT_MAX_ERROR
	).area().getInfo() / ASSESSMENT_SCALE

# takes a feature collection of the class and overlays a 10km sq grid on top of it then returns
def aoo_area(interest, region):

	grid = generate_grid(region)

	contains = interest.unmask(0).multiply(
	  ee.Image.pixelArea()
	).reduceRegions(
	  reducer=ee.Reducer.sum(),
	  collection=grid,
	  scale=100
	)

	areas = [ n['properties']['sum'] for n in contains.getInfo()['features'] ]

	total_area = sum(areas)
	aoo = sum([a > 0 for a in areas])
	aoo_1pc = sum([a > 1e6 for a in areas]) # squares with more than 1e6
	return aoo, aoo_1pc, len(areas), total_area / ASSESSMENT_SCALE

	""" old method"""
	# raster method
	aoi = class_poly.geometry().bounds().buffer(ASSESSMENT_AOO_BUFFER).bounds()
	import_grid_raster = ee.Image("users/murrnick/geePipe/AOOGrid_10k_WGS").clip(aoi)
	import_grid = import_grid_raster.reduceToVectors(geometry=aoi, geometryType='polygon')

	# Filter
	occupied_grid = import_grid.filterBounds(class_poly)
	aoo = occupied_grid.size().getInfo()
	return aoo

def class_area(class_poly):
	return class_poly.geometry().area(maxError=ASSESSMENT_MAX_ERROR).getInfo()

def generate_grid(region):
	bounds = region.bounds().getInfo()['coordinates'][0]

	x = [ _[0] for _ in bounds ]
	y = [ _[1] for _ in bounds ]

	xmin, xmax = min(x), max(x)
	ymin, ymax = min(y), max(y)

	a = 6378137 # radius of earth in meters
	lat_per_km = 1.0/110.574 # the error in lat per change of lat is very small so we fix it to a constant for every latitude

	dy = 10 * lat_per_km

	rads = lambda x : math.pi * x / 180.0
	dlong = lambda x :  math.pi * a * math.cos(rads(x)) / (180.0 * 1e3) 
	long_per_km = 2 / (dlong(ymin) + dlong(ymax)) # average km_per_long in region
	dx = 10 * long_per_km

	xlength = abs(xmax - xmin)
	ylength = abs(ymax - ymin)

	xsteps = math.ceil(xlength / dx)
	ysteps = math.ceil(ylength / dy)

	xs = [ xmin + i * dx for i in range( -1 , int(xsteps) + 2)]
	ys = [ ymin + i * dx for i in range( -1 , int(ysteps) + 2)]

	grids_indicies = [[
		[i, j],
		[i, j + 1],
		[i + 1, j + 1],
		[i + 1, j],
		[i, j]]
	for i in range(-1, int(xsteps) + 1)
	for j in range(-1, int(ysteps) + 1) ]

	coords = [
		[
			[xs[c[0]], ys[c[1]]]
			for c in g ]
		for g in grids_indicies ]

	return ee.FeatureCollection([ ee.Feature(ee.Geometry.Polygon(g)) for g in coords ])
