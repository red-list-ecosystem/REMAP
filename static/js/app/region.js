/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the region on the map, excluded is initRegion
  which is in init.js
*/

// Construct the polygon.
function addRegion (polyCoords) {
  if (region) {
    region.setMap(null)
  }
  region = new google.maps.Polygon({
    paths: polyCoords,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.05,
    editable: true,
    geodesic: true,
    clickable: false
  })
  region.setMap(map)
}

// function to convert legacy format [lat, lng] to current format {'lat': lat, 'lng': lng}
function regionFix (arr) {
  if (arr.length > 0 && Array.isArray(arr[0])) {
    var obj = []
    for (var i = 0; i < arr.length; i++) {
      obj.push({'lat': arr[i][0], 'lng': arr[i][1]})
    }
    return obj
  }
  return arr
}

function addRegionFocus (arr, json) {
  json = typeof json === 'undefined' ? false : json
  var bounds = new google.maps.LatLngBounds()
  if (json) {
    arr = regionFix(arr)
    addRegion(arr)
    for (var i = 0; i < arr.length; i++) {
      bounds.extend(new google.maps.LatLng(arr[i]['lat'], arr[i]['lng']))
    }
  } else {
    var polyCoords = []
    for (var i = 0; i < arr.length; i++) {
      polyCoords.push({'lat': arr[i][1], 'lng': arr[i][0]})
      bounds.extend(new google.maps.LatLng(arr[i][1], arr[i][0]))
    }
    addRegion(polyCoords)
  }
  map.fitBounds(bounds)
}

function regionPath () {
  return region.getPath().getArray().map(
    function (x) { return {lat: x.lat(), lng: x.lng()} })
}

/* Brings the region into focus. */
function reFocusRegion () {
  var bounds = map.getBounds().toJSON()
  var nsBuffer = Math.abs(bounds.north - bounds.south) / 4
  var ewBuffer = Math.abs(bounds.east - bounds.west) / 4

  var topLeft = {lat: bounds.north - nsBuffer, lng: bounds.west + ewBuffer}
  var topRight = {lat: bounds.north - nsBuffer, lng: bounds.east - ewBuffer}
  var bottomLeft = {lat: bounds.south + nsBuffer, lng: bounds.west + ewBuffer}
  var bottomRight = {lat: bounds.south + nsBuffer, lng: bounds.east - ewBuffer}

  var polyBounds = [
    topLeft, topRight, bottomRight, bottomLeft
  ]

  region.setPaths(polyBounds)
}

function getRegion () {
  var verts = region.getPath()
  var coordArr = []
  for (var i = 0; i < verts.getLength(); i++) {
    var xy = verts.getAt(i)
    coordArr.push({'lat': xy.lat(), 'lng': xy.lng()})
  }
  return coordArr
}
