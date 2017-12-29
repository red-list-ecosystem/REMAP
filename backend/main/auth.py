import config
import drive
import ee
import httplib2
import json
import oauth2client
import remap
import time
import uuid
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from google.appengine.api import taskqueue
from datetime import datetime, timedelta
from datastore import *
from shared import *
from remap_api import *

APP_CREDENTIALS = oauth2client.service_account.ServiceAccountCredentials.from_json_keyfile_name(
    config.EE_PRIVATE_KEY_FILE,
    scopes='https://www.googleapis.com/auth/drive')
APP_DRIVE_HELPER = drive.DriveHelper(APP_CREDENTIALS)

# clears out exported files that errored before deletion


class Clean(webapp2.RequestHandler):
    def get(self):
        while True:
            files = APP_DRIVE_HELPER.GetExportedFiles('')
            now = datetime.utcnow()
            for f in files:
                cDate = datetime.strptime(
                    f['createdDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
                if now - cDate > timedelta(hours=2):
                    APP_DRIVE_HELPER.DeleteFile(f['id'])
            if len(files) < 100:
                break


class OAuth(BaseHandler):
    def post(self):
        code = json.loads(self.request.body)['code']
        self.session['reload'] = True
        if code != '':
            credentials = oauth2client.client.credentials_from_clientsecrets_and_code(
                filename=config.OAUTH_FILE,
                code=code,
                scope='https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email'
            )
            http = credentials.authorize(httplib2.Http())
            # surely there's an easier way to get the email?
            ui = build('plus', 'v1', http=http)
            userinfo = ui.people().get(userId='me').execute(http=http)
            # maybe not 0? how do we determine which is the right email address
            self.session['email'] = userinfo['emails'][0]['value']
            self.session['user_id'] = userinfo['id']
            self.session['credentials'] = credentials.to_json()


class SignOut(BaseHandler):
    def post(self):
        self.session.pop('email', None)
        self.session.pop('user_id', None)
        self.session.pop('credentials', None)


class ExportStatus(BaseHandler):
    def get(self):
        status = checkDatastoreProgress(self.session['email'])
        self.response.write(status)


class Export(GetMapData):
    """Allows for the exporting of a classified region as a geotiff to a users
            Google Drive.
    """

    """GAE will throw a DeadlineExceededError on the frontend if queries take longer than 60 seconds
        So in POST we fire off a background task that will do the export and return immediately (<1 second)
        GET gets polled every x seconds by the front end while waiting for the export task to complete
        TODO: consider other implementations using Firebase Realtime Database, socket.io or similar
    """

    def post(self):
        datastoreProgress(self.session['email'], 'IN_PROGRESS')
        taskqueue.add(
            url='/exportworker',
            params={
                'data': self.request.body,
                'ip': self.request.remote_addr,
                'credentials': self.session['credentials'],
                'email': self.session['email']
            })
        self.response.write(json.dumps({}))


class ExportWorker(GetMapData):
    def build_meta_file(self):
        header = ['Class, GeoTIFF Value']
        meta_list = header + ["%s, %s" % (c['name'], i + 1)
                              for i, c in enumerate(self.classes)]
        # meta_list.append('missing_data, 0')
        meta_list.append('pixel_scale_m, ' + str(config.EXPORT_TIFF_SCALE))
        if self.past:
            meta_list.append('Time Frame, 99-03')
        else:
            meta_list.append('Time Frame, 14-17')
        meta_list.append('Citation, "%s"' % config.CITATION)
        return '\n'.join(meta_list)

    def post(self):
        try:
            retryCount = int(self.request.headers.get(
                'X-AppEngine-TaskExecutionCount'))
            if retryCount >= 1:
                # stop retrying
                return
        except:
            pass
        meta_file = self.build_meta_file()
        datastore(self.request.get('ip'),
                  self.request.headers.get('User-Agent'),
                  sum([len(label['points']) for label in self.classes]),
                  len(self.classes),
                  True,
                  json.dumps(self.data['region']))

        temp_file_prefix = str(uuid.uuid4())
        export_time = time.ctime()
        file_name = 'REMAP GeoTIFF Export ' + export_time + '.tif'

        classified = remap.get_classified_from_fc(
            self.train_fc, self.predictors, self.past).clip(self.region)

        task = ee.batch.Export.image(
            image=classified,
            description=file_name,
            config={
                'driveFileNamePrefix': temp_file_prefix,
                'maxPixels': 1e10,
                'scale': config.EXPORT_TIFF_SCALE,
                'region': json.dumps([[x['lng'], x['lat']] for x in self.data['region']])
            })
        # Kangaroo Island CSV points
        # scale  30 took 1335.49342012 seconds (22 mins)
        # scale 100 took 177.377995968 seconds (3 mins)

        task.start()
        while task.active():
            time.sleep(10)

        state = task.status()['state']
        if state == ee.batch.Task.State.COMPLETED:
            files = APP_DRIVE_HELPER.GetExportedFiles(temp_file_prefix)
            credentials = oauth2client.client.OAuth2Credentials.from_json(
                self.request.get('credentials'))
            for f in files:
                APP_DRIVE_HELPER.GrantAccess(
                    f['id'], self.request.get('email'))
            user_drive_helper = drive.DriveHelper(credentials)
            if len(files) > 0:
                folder = user_drive_helper.CreateFolder(
                    'REMAP Export Folder ' + export_time)
                user_drive_helper.CreateFile(
                    'REMAP metadata ' + export_time + '.csv', meta_file, folder)
                for f in files:
                    try: 	# will fail if the user doesn't have the right permissions
                                            # just ignore it since it might have accidentally found someone else's file
                        user_drive_helper.CopyFile(f['id'], file_name, folder)
                    except:
                        pass
                APP_DRIVE_HELPER.DeleteFile(f['id'])
            datastoreProgress(self.request.get('email'), 'COMPLETED')
        else:
            datastoreProgress(self.request.get('email'), 'ERROR')
