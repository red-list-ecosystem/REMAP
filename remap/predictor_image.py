"""
	Predictor image generator functions
"""
import ee
import json
from parameters import *


def predictor_image(past = False):
	""" Returns an ee image, that will be used as a predictor.
		start_date, and end_date currently do nothing, as we are loading a precomputed landsat image.
		with predictors as bands. missing data is given the value of -20k
	"""
	return base_predictor_layer(past).unmask(-20000)

def base_predictor_layer(past = False):
	# 1. BIOCLIM
	bioclim = ee.Image('WORLDCLIM/V1/BIO').select(
					['bio01', 					'bio12'], 
					['Mean Annual Temperature', 'Annual Precipitation'])
	# 2. Elevation / Slope
	elevation = ee.Image('USGS/SRTMGL1_003').rename(['Elevation'])
	slope = ee.Terrain.slope(elevation).rename(['Slope'])

	def brightness_img(imgCol, start, end, from_):
		collection = ee.ImageCollection(imgCol).filterDate(start, end)
		collection = collection.map(lambda pic: pic.updateMask(pic.select("cfmask").lte(1)))
		collection = collection.select(from_, ["Blue", "Green", "Red", "NIR"]).median()
		return collection
		total = collection.reduce(ee.Reducer.sum())
  		return collection.divide(total)

  	"""
	if past: 
		ls = brightness_img("LANDSAT/LE7_SR", "1999-01-01", "2003-01-01",["B1", "B2", "B3", "B4"])
	else:
		ls = brightness_img("LANDSAT/LC8_SR", "2014", "2017",["B2", "B3", "B4", "B5"])
	"""
	# 3. Landsat 8
	if not past:
		ls = ee.Image('users/JohnHWilshire/ls_8_cflte1_2k14to17_at_30m_ui8')
	else:
		ls = ee.Image('users/JohnHWilshire/ls_7_self_masked_99_03_at_30m')
		# ls = ee.Image('users/JohnHWilshire/ls_5_cflte1_85to95_at_30m_ui8')
	


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
