predictors = [
    {
        "description": "todo", 
        "long_name": "Normalised Difference Vegetation index", 
        "short_name": "NDVI",
        "type": "Index",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": True,
        "ramp": '000000, 00FF00'
    }, 
    {
        "description": "todo", 
        "long_name": "Normalised Difference Water index", 
        "short_name": "NDWI",
        "type": "Index",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": True,
        "ramp":'070467, 17ffed'

    },
    {
        "description": "todo", 
        "long_name": "Water Band Index", 
        "type": "Index",
        "ee_import": 'LANDSAT/LC8_SR',
        "short_name": "WBI",
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": "Blue band minus Red band", 
        "type": "Index",
        "ee_import": 'LANDSAT/LC8_SR',
        "short_name": "BR",
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": "Normalised Difference Blue Green", 
        "short_name": "BG",
        "type": "Index",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": " Blue band", 
        "short_name": "Blue",
        "type": "Band Value",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": "Green band", 
        "short_name": "Green",
        "type": "Band Value",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": "Red band", 
        "short_name": "Red",
        "type": "Band Value",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": False
    }, 
    {
        "description": "todo", 
        "long_name": "Near Infrared band", 
        "short_name": "NIR",
        "type": "Band Value",
        "ee_import": 'LANDSAT/LC8_SR',
        "checked": True,
        "vis": True,
        "ramp":'000000,ffffff',
    },
    {
        "description": "todo", 
        "type": "Elevation",
        "long_name": "SRTM Digital Elevation Data 30m", 
        "short_name": "Elevation",
        "ee_import": 'USGS/SRTMGL1_003',
        "checked": True,
        "vis": True,
        "ramp":"00a0b0,edc951,ed6841,cc2a36,4f372d"
    },
    {
        "description": "todo", 
        "type": "Elevation",
        "long_name": "SRTM Slope", 
        "short_name": "Slope",
        "ee_import": 'USGS/SRTMGL1_003',
        "checked": True,
        "vis": True,
        "ramp":"edc951,ed6841,cc2a36,4f372d,00a0b0"
    }, 
    {
        "description": "todo", 
        "type": "BIOCLIM",
        "long_name": "Mean Annual Temperature", 
        "ee_import": 'WORLDCLIM/V1/BIO',
        "short_name": "Mean Annual Temperature",
        "vis": True,
        "ramp":"39018a,0090fe,98ff77,ffff0b,fa0100,590000"
    }, 
    {
        "description": "todo", 
        "long_name": "Annual Precipitation", 
        "type": "BIOCLIM",
        "ee_import": 'WORLDCLIM/V1/BIO',
        "short_name": "Annual Precipitation",
        "vis": True,
        "ramp":'ffffff,c7d6f7,00057a'
    }
]

predictor_dict = {}

# build a dict for vis lookup later
for p in predictors:
    predictor_dict[p['short_name']] = p 
