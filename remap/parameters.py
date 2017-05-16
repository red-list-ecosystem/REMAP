"""
	Pipe specific parameters, relating to classification and visualisation.
"""

parameters = {
	#############################################
	# CLASSIFICATION
	############################################# 
	# Training set building
	'reduce_to_vector_scale':1,
	'class_image_null': 255,
	'cfmask_ls8_lte':1,
	# Classifier specific
	
	'oob_mode':True,
	'number_of_trees': 100,
	'min_leaf_pop': 13,
	'histogram_scale': 100,
	'best_effort': True,
	'pred_vis_points': 100
}
