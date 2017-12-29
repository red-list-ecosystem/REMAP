import httplib2
import oauth2client
import webapp2
from webapp2_extras import sessions
import logging


class BaseHandler(webapp2.RequestHandler):
    def dispatch(self):
        self.session_store = sessions.get_store(request=self.request)
        if 'credentials' in self.session:
            credentials = oauth2client.client.OAuth2Credentials.from_json(
                self.session['credentials'])
            if credentials.access_token_expired:
                try:
                    credentials.refresh(httplib2.Http())
                    self.session['credentials'] = credentials.to_json()
                except:
                    self.session.pop('email', None)
                    self.session.pop('user_id', None)
                    self.session.pop('credentials', None)
        try:
            webapp2.RequestHandler.dispatch(self)
        finally:
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        return self.session_store.get_session(backend="datastore")
