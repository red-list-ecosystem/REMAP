import ee

from parameters import *
from predictor_image import *

def get_classifier(training, bands):
	classifier = ee.Classifier.randomForest(
		numberOfTrees = parameters['number_of_trees'],
		minLeafPopulation = parameters['min_leaf_pop'],
		outOfBagMode = parameters['oob_mode']
	)
	return classifier.train(training, "label", bands)

def get_classified_from_fc(train_fc, predictors, past = False):
	composite = predictor_image(past).select(predictors)
	training = composite.reduceRegions(
		train_fc,
		reducer = ee.Reducer.first(),
		scale = parameters['reduce_to_vector_scale']
	)
	classifier = get_classifier(training, composite.bandNames())
	composite = predictor_image(past).select(predictors)
	return composite.classify(classifier)

def get_perf_from_fc(train_fc, predictors):
	composite = predictor_image().select(predictors)
	training = composite.reduceRegions(
		train_fc,
		reducer = ee.Reducer.first(),
		scale = parameters['reduce_to_vector_scale']
	)
	classifier = get_classifier(training, composite.bandNames())
	return classifier.confusionMatrix()
