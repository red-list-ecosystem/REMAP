import ee
import os
from google.appengine.api import urlfetch

WSGI_KEY = open('secrets/wsgi.txt').read().strip()
EE_ACCOUNT = open('secrets/ee_account.txt').read().strip()
EE_PRIVATE_KEY_FILE = 'secrets/gee_service_account_secrets.json'
OAUTH_FILE = 'secrets/oauth_secret.json'

EE_CREDENTIALS = ee.ServiceAccountCredentials(EE_ACCOUNT, EE_PRIVATE_KEY_FILE)
ee.Initialize(EE_CREDENTIALS)

# meters per side of pixel for the exported tiff
EXPORT_TIFF_SCALE = 30
DEFAULT_COLOUR_RAMP = "f7fcf5,e5f5e0,c7e9c0,a1d99b,74c476,41ab5d,238b45,006d2c,00441b"
ASSESSMENT_REDUCE_SCALE = 100

MAX_POINTS = 2500

# area threshold in km^, the area of the region cannot exceed this
AREA_THRESHOLD = 100000

CITATION = 'Murray, N. J., Keith, D. A., Simpson, D. , Wilshire, J. H. and Lucas, R. M. (2018), Remap: An online remote sensing application for land cover classification and monitoring. Methods Ecol Evol. Accepted Author Manuscript. . doi:10.1111/2041-210X.13043'
# old citation:
# CITATION = 'Murray, N.J., Keith, D.A., Simpson, D., Wilshire, J.H. & Lucas, R.M. (2017) REMAP: An online remote sensing application for land cover classification and monitoring. bioRxiv. DOI: 10.1101/212464'
# flag to check if we are running in debug mode or not
DEBUG = os.environ.get('SERVER_SOFTWARE', '').startswith('Development')

# displayed in the tutorials page
SAMPLE_DATA = [
    {
    'name': 'Deforestation training set',
    'json': 'remap_training_amazonDeforestation.json',
    'csv':  'remap_points_amazonDeforestation.csv'
  },
  {
    'name': 'Mangrove training set',
    'json': 'remap_training_carpentariaMangroves.json',
    'csv': 'remap_points_carpentariaMangroves.csv'
  },
  {
    'name': 'Cheduba Island landcover training set',
    'json': 'remap_training_chedubaMyanmar.json',
    'csv': 'remap_points_chedubaMyanmar.csv'
  },
  {
    'name': 'Dubai Coastal Reclamation Dataset (2003)',
    'json': 'remap_training_Dubai_2003.json',
    'csv': 'remap_points_Dubai_2003.csv'
  },
  {
    'name': 'Dubai Coastal Reclamation Dataset (2017)',
    'json': 'remap_training_Dubai_2017.json',
    'csv': 'remap_points_Dubai_2017.csv'
  }
]

# see : https://groups.google.com/d/msg/google-earth-engine-developers/vwT_CUGFvfc/pNjYXMHdAQAJ
# for more information
urlfetch.set_default_fetch_deadline(120000)
ee.data.setDeadline(60000)
