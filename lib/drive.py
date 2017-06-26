#!/usr/bin/env python
"""Helpers for interfacing with Google Drive."""

from apiclient import discovery, http
from io import BytesIO
import httplib2


class DriveHelper(object):
  """A helper class for interfacing with Google Drive."""

  def __init__(self, credentials):
    """Creates a credentialed Drive service with the given credentials.

    Args:
      credentials: The OAuth2 credentials.
    """
    http = credentials.authorize(httplib2.Http())
    self.service = discovery.build('drive', 'v2', http=http)

  def GrantAccess(self, file_id, email):
    """Grants the email address write access to the file with the given ID.

    Note: "writer" access is required to create a copy of a file.

    Args:
      file_id: The ID of the file to which to grant access.
      email: The email address to grant access.
    """
    # Determine the permission ID for the email address.
    id_resp = self.service.permissions().getIdForEmail(email=email).execute()
    new_permission = {
        'type': 'user',
        'role': 'writer',
        'id': id_resp['id']
    }
    self.service.permissions().insert(
        fileId=file_id,
        body=new_permission,
        sendNotificationEmails=False).execute()

  def CopyFile(self, origin_file_id, copy_title, parent_folder=None):
    """Copies the file with the ID in the user's root folder with the title.

    Args:
      origin_file_id: The ID of the file to copy.
      copy_title: The title to give to the created file.
      parent_folder (optional): The folder to copy the file into. Defaults to root folder.

    Returns:
      The file ID of the copy.
    """
    body = {'title': copy_title}
    if parent_folder is not None:
      body['parents'] = [{'id': parent_folder}]
    copied_file = self.service.files().copy(
        fileId=origin_file_id, body=body).execute()
    return copied_file['id']

  def GetExportedFiles(self, prefix):
    """Returns the Drive file ID of the first file found with the prefix.

    Args:
      prefix: The prefix of the title of the file to identify.

    Returns:
      A list of Drive file objects that match the prefix.
    """
    prefix_with_escaped_quotes = prefix.replace('"', '\\"')
    query = 'title contains "%s"' % prefix_with_escaped_quotes
    files = self.service.files().list(q=query).execute()
    return files.get('items')

  def DeleteFile(self, file_id):
    """Deletes the file with the given ID.

    Args:
      file_id: The ID of the file to delete.
    """
    self.service.files().delete(fileId=file_id).execute()

  def CreateFile(self, file_name, content, parent_folder=None):
    """ Creates a file with the given name and content

    Args:
      file_name: The name of the file to create.
      content: The content of the new file.
      parent_folder (optional): The folder to copy the file into. Defaults to root folder. 

    Returns:
      The file id.
    """
    fh = BytesIO(str(content))
    media = http.MediaIoBaseUpload(fh, mimetype='text/csv', resumable=True)
    file_metadata = {
      'title': file_name,
      'mimeType': 'text/csv',
      'parents': [{'id': parent_folder}]
    }
    file = self.service.files().insert(body=file_metadata, media_body=media).execute()
    return file['id']

  def CreateFolder(self, folder_name):
    """Creates a folder with the given name

    Args:
      folder_name: The name of the folder to create.

    Returns:
      The folder id.
    """
    folder_metadata = {
      'title': folder_name,
      'mimeType': 'application/vnd.google-apps.folder'
    }
    folder = self.service.files().insert(body=folder_metadata).execute()
    return folder['id']