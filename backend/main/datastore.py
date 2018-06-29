import json
from google.appengine.ext import ndb


def kmlify(rgn):
    rgnString = ''
    rgn = json.loads(rgn)
    for idx, r in enumerate(rgn):
        if idx != 0:
            rgnString += ' '
        rgnString += str(r['lng']) + ',' + str(r['lat']) + ',0'
    return '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + rgnString + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'


class Progress(ndb.Model):
    emailAddress = ndb.StringProperty()
    exportProgress = ndb.StringProperty()


class Query(ndb.Model):
    ipAddress = ndb.StringProperty()
    userAgent = ndb.StringProperty()
    nPoints = ndb.IntegerProperty()
    nClasses = ndb.IntegerProperty()
    region = ndb.TextProperty()
    isDrive = ndb.BooleanProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)


class Training(ndb.Model):
    data = ndb.TextProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)


def checkDatastoreProgress(email):
    query = Progress.query(Progress.emailAddress == email).fetch()
    if len(query) > 0:
        return query[0].exportProgress
    else:
        return 'NOT_STARTED'


def datastore(ip, agent, nPts, nCls, isDrv, rgn):
    q = Query(ipAddress=ip, userAgent=agent, nPoints=nPts,
              nClasses=nCls, isDrive=isDrv, region=kmlify(rgn))
    q.put()


def datastoreClearOldTraining(beforeTime):
    trainingKeys = Training.query(
        Training.date <= beforeTime).fetch(keys_only=True)
    ndb.delete_multi(trainingKeys)


def datastoreProgress(email, progress):
    query = Progress.query(Progress.emailAddress == email).fetch()
    if len(query) > 0:
        p = query[0]
        p.exportProgress = progress
    else:
        p = Progress(emailAddress=email, exportProgress=progress)
    p.put()


def datastoreTraining(data):
    t = Training(data=data)
    return t.put()


def getDatastoreTraining(key):
    dataKey = ndb.Key(urlsafe=key)
    t = dataKey.get()
    if t is None:
        return None
    dataKey.delete()
    data = json.loads(t.data)
    return data
