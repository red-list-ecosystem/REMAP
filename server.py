import os, sys, json
if 'lib' not in sys.path: 
	sys.path.append('lib') # add lib to the path
import config
import remap
import webapp2, jinja2, logging
from main import *
from pprint import pprint as pp 
jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))
wsgiConfig = {}
wsgiConfig['webapp2_extras.sessions'] = {
	'secret_key': config.WSGI_KEY
}

def kmlify(rgn):
	rgnString = ''
	rgn = json.loads(rgn)
	for idx,r in enumerate(rgn):
		if idx != 0:
			rgnString += ' '
		rgnString += str(r['lng']) + ',' + str(r['lat']) + ',0'
	return '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + rgnString + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'

class MainPage(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/index.html')
		reloadBool = 'reload' in self.session
		self.session.pop('reload', None)
		self.response.out.write(template.render({
			'predictors': remap.predictors,
			'oauth_url': flow.step1_get_authorize_url(), # is this fine to return when the user is already signed in?
			'oauth': str('credentials' in self.session).lower(),
			'reload': str(reloadBool).lower(),
			'email': 'Not signed in.' if 'email' not in self.session else self.session['email'],
			'DEBUG': config.DEBUG
		}))

class Home(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/home.html')
		self.response.out.write(template.render({'DEBUG': config.DEBUG}))

class Tutorial(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/tutorial.html')
		self.response.out.write(template.render({'DEBUG': config.DEBUG}))

class About(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/about.html')
		self.response.out.write(template.render({'DEBUG': config.DEBUG}))

class Privacy(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/privacy.html')
		self.response.out.write(template.render({'DEBUG': config.DEBUG}))


class FAQ(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/faq.html')
		self.response.out.write(template.render({'DEBUG': config.DEBUG}))

class Methods(BaseHandler):
	def get(self):
		template = jinja_environment.get_template('templates/methods.html')
		self.response.out.write(template.render({
			'predictors': remap.predictors,
			'DEBUG': config.DEBUG}))

def handle_error(request, response, exception):
	""" Sends the error for post requests back to the client in json format
	"""
	logging.error(exception.message)
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

# Routing
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
	('/tutorial', Tutorial),
	('/methods', Methods),
	('/about', About),
	('/privacy', Privacy),
	('/faq', FAQ)
], debug=config.DEBUG, config=wsgiConfig)
app.error_handlers[500] = handle_error
