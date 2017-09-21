import config, drive, ee, httplib2, json, oauth2client, remap, time, uuid
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from google.appengine.api import taskqueue
from datetime import datetime, timedelta
from datastore import *
from shared import *
from remap_api import *

APP_CREDENTIALS = oauth2client.client.SignedJwtAssertionCredentials(
	config.EE_ACCOUNT,
	open(config.EE_PRIVATE_KEY_FILE, 'rb').read(),
	scope='https://www.googleapis.com/auth/drive')
APP_DRIVE_HELPER = drive.DriveHelper(APP_CREDENTIALS)

flow = oauth2client.client.flow_from_clientsecrets(config.OAUTH_FILE,
	scope='https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
	redirect_uri=config.CALLBACK_URL)
flow.params['access_type'] = 'offline'

# never gets called but should be run occasionally to clear out exported files that errored before deletion
def clearOldExports():
	files = APP_DRIVE_HELPER.GetExportedFiles('')
	print(len(files))
	now = datetime.utcnow()
	for f in files:
		cDate = datetime.strptime(f['createdDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
		print(now - cDate)
		if now - cDate > timedelta(days=7):
			APP_DRIVE_HELPER.DeleteFile(f['id'])
	print(len(files))

class OAuth(BaseHandler):
	def get(self):
		code = self.request.get('code')
		self.session['reload'] = True
		if code != '':
			credentials = flow.step2_exchange(self.request.get('code'))
			http = credentials.authorize(httplib2.Http())
			# surely there's an easier way to get the email?
			ui = build('plus', 'v1', http=http)
			userinfo = ui.people().get(userId='me').execute(http=http)
			self.session['email'] = userinfo['emails'][0]['value'] # maybe not 0? how do we determine which is the right email address
			self.session['user_id'] = userinfo['id']
			self.session['credentials'] = credentials.to_json()
		self.redirect('/')

class Logout(BaseHandler):
	def post(self):
		self.session.pop('email', None)
		self.session.pop('user_id', None)
		self.session.pop('credentials', None)
		self.redirect('/')

class Export(BaseHandler):
	"""Allows for the exporting of a classified region as a geotiff to a users 
		Google Drive.
	"""

	"""GAE will throw a DeadlineExceededError on the frontend if queries take longer than 60 seconds
		So in POST we fire off a background task that will do the export and return immediately (<1 second)
		GET gets polled every x seconds by the front end while waiting for the export task to complete
		TODO: consider other implementations using Firebase Realtime Database, socket.io or similar
	"""
	def get(self):
		self.response.write(checkDatastoreProgress(self.session['email']))

	def post(self):
		datastoreProgress(self.session['email'], 'IN_PROGRESS')
		taskqueue.add(
			url = '/exportworker',
			params = {
				'data': self.request.body,
				'ip': self.request.remote_addr,
				'credentials': self.session['credentials'],
				'email': self.session['email']
			})
		self.response.write(json.dumps({}))

class ExportWorker(GetMapData):
	def post(self):
		# build the metadata file
		header = ['Class, GeoTIFF Value']
		meta_list = header + ["%s, %s" % (c['name'] , i + 1) for i, c  in enumerate(self.classes)]
		# meta_list.append('missing_data, 0')
		meta_list.append('pixel_scale_m, ' + str(config.EXPORT_TIFF_SCALE))
		meta_file = '\n'.join(meta_list)

		datastore(self.request.get( 'ip'), 
			self.request.headers.get('User-Agent'),
			sum([ len( label['points'] ) for label in self.classes ]),
			len(self.classes),
			True,
			json.dumps(self.data['region']))


		temp_file_prefix = str(uuid.uuid4())
		export_time = time.ctime()
		file_name = 'REMAP GeoTIFF Export ' + export_time + '.tif'

		classified = remap.get_classified_from_fc(self.train_fc, self.predictors).clip(self.region)

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
			print('Done, Copying ...')

			files = APP_DRIVE_HELPER.GetExportedFiles(temp_file_prefix)
			credentials = oauth2client.client.OAuth2Credentials.from_json(self.request.get('credentials'))
			for f in files:
				APP_DRIVE_HELPER.GrantAccess(f['id'], self.request.get('email'))
			user_drive_helper = drive.DriveHelper(credentials)
			if len(files) > 0:
				folder = user_drive_helper.CreateFolder('REMAP Export Folder ' + export_time)
				user_drive_helper.CreateFile('REMAP metadata ' + export_time + '.csv', meta_file, folder)
				for f in files:
					try: 	# will fail if the user doesn't have the right permissions
								# just ignore it since it might have accidentally found someone else's file
						user_drive_helper.CopyFile(f['id'], file_name, folder)
					except:
						pass
				APP_DRIVE_HELPER.DeleteFile(f['id'])
			datastoreProgress(self.request.get('email'), 'COMPLETED')
			print('Done!')
		else:
			datastoreProgress(self.request.get('email'), 'ERROR')
			print('Error')