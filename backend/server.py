import os
import sys
import json
if 'lib' not in sys.path:
    sys.path.append('lib')  # add lib to the path
import config
import remap
import webapp2
import jinja2
import logging

from main import *


jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))
wsgiConfig = {}
wsgiConfig['webapp2_extras.sessions'] = {
    'secret_key': config.WSGI_KEY
}
wsgiConfig["webapp2_extras.auth"] = {'session_backend': 'memcache'}


def kmlify(rgn):
    rgnString = ''
    rgn = json.loads(rgn)
    for idx, r in enumerate(rgn):
        if idx != 0:
            rgnString += ' '
        rgnString += str(r['lng']) + ',' + str(r['lat']) + ',0'
    return '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + rgnString + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'


class Home(BaseHandler):
    def get(self):
        template = jinja_environment.get_template('templates/home.html')
        self.response.out.write(template.render({'DEBUG': config.DEBUG}))


class Tutorial(BaseHandler):
    def get(self):
        template = jinja_environment.get_template('templates/tutorials.html')
        self.response.out.write(template.render({'DEBUG': config.DEBUG, 'sample_data': config.SAMPLE_DATA}))


class About(BaseHandler):
    def get(self):
        template = jinja_environment.get_template('templates/about.html')
        self.response.out.write(template.render({
            'DEBUG': config.DEBUG,
            'citation': config.CITATION
        }))


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


class Config(BaseHandler):

    """ Retrives some startup parameters for remap ie max region size ect
    """

    def get(self):
        self.response.headers.add_header('Content-Type', 'application/json')
        self.response.out.write(json.dumps({
            'max_area': config.AREA_THRESHOLD,
            'debug': config.DEBUG,
            'predictors': remap.predictors
        }))


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
    # website endpoints
    ('/', Home),
    ('/tutorials', Tutorial),
    ('/methods', Methods),
    ('/about', About),
    ('/privacy', Privacy),
    ('/faq', FAQ),
    # api endpoints
    ('/api/map', GetMapData),
    ('/api/performance', GetPerformance),
    ('/api/assessment/aoo', AOO),
    ('/api/assessment/eoo', EOO),
    ('/api/config', Config),
    ('/api/areadata', GetHistData),
    ('/api/predictorlayer', GetPredictorLayer),
    ('/oauth2callback', OAuth),
    ('/api/signout', SignOut),
    ('/api/export', Export),
    ('/api/exportstatus', ExportStatus),
    ('/exportworker', ExportWorker),
    ('/tasks/clean', Clean)
], debug=config.DEBUG, config=wsgiConfig)
app.error_handlers[500] = handle_error
