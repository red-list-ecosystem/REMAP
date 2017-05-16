"""
	Predictor image generator functions
"""
import ee
import json
from parameters import *


def predictor_image(start_date = '2014-01-01', end_date = '2016-01-01'):
	""" Returns an ee image, that will be used as a predictor.
		start_date, and end_date currently do nothing, as we are loading a precomputed landsat image.
		with predictors as bands. missing data is given the value of -20k
	"""
	return base_predictor_layer(start_date, end_date).unmask(-20000)

def base_predictor_layer(start_date = '2015-01-01', end_date = '2016-01-01'):
	###############################################################
	# 1. BIOCLIM
	###############################################################
	bioclim = ee.Image('WORLDCLIM/V1/BIO').select(
					['bio01', 					'bio12'], 
					['Mean Annual Temperature', 'Annual Precipitation'])
	###############################################################
	# 2. Elevation / Slope
	###############################################################
	elevation = ee.Image('USGS/SRTMGL1_003').rename(['Elevation'])
	slope = ee.Terrain.slope(elevation).rename(['Slope'])
	###############################################################
	# 3. Landsat 8
	###############################################################
	ls = ee.ImageCollection('LANDSAT/LC8_SR').filterDate(start_date, end_date).map(
		lambda pic: pic.updateMask(pic.select("cfmask").lte(parameters['cfmask_ls8_lte'])))
	ls = ls.select(['B2',	'B3',	'B4',	'B5',], # and rename them to:
				   ['Blue', 'Green', 'Red', 'NIR',])
	ls = ls.median()
	# NEW:

	return ee.Image([
			bioclim,
			elevation,
			slope,
			ls,
			ls.normalizedDifference(['NIR', 'Red']).rename(['NDVI']),
			ls.normalizedDifference(['Green', 'NIR']).rename(['NDWI']),
			ls.select('Blue').divide(ls.select('NIR')).rename(['WBI']),
			ls.select('Blue').subtract(ls.select('Red')).rename(['BR']),
			ls.normalizedDifference(['Blue', 'Green']).rename(['BG'])
		])#.unmask(-20000) # set missing values to -20k
