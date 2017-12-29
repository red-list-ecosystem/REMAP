/**
 Daniel Simpson,
 John Wilshire

 2017

 Init functions
*/

// list to store classes
var classList = []
var listenerHandle = false
var classified = false
var region = false
var refreshChart = true
var mapBuffer = 0.01 // lat long used when we surround the csv loaded points
var past = false;
// colours from  https://personal.sron.nl/~pault/
var colours = [
  "#77AADD",
  "#DDAA77",
  "#77CCCC",
  "#CC99BB",
  "#DDDD77",
  "#DD7788",
  "#4477AA",
  "#AA7744",
  "#44AAAA",
  "#AA4488",
  "#AAAA44",
  "#AA4455",
  "#114477",
  "#774411",
  "#117777",
  "#771155",
  "#777711",
  "#771122"
]

// default vis parameters
var vis = {mean: 0, total_sd: 1}

var log = function (x) { }
// Initialize the Google Map and add our custom layer overlay.
var initialize = function (oauth, reload) {
  google.charts.load('current', {packages: ['corechart', 'bar']})
  // Create the base Google Map.
  var myLatLng = new google.maps.LatLng(-35.8691162172, 137.320622559)
  var mapOptions = {
    center: myLatLng,
    zoom: 9,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    zoomControl: true,
    scaleControl: true,
    streetViewControl: false,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  }

  map = new google.maps.Map($('#map')[0], mapOptions)

  $('#spinner').hide()
  $('#modal1').modal()
  $('#modal2').modal()
  $('#modal3').modal()
  $('#assessment-modal').modal({
    complete: function () {
      $('#assessment_btn').removeClass('disabled')
    }
  })

  if (window.matchMedia('(max-width: 992px)').matches) {
    $('#mobile-modal').modal()
    $('#mobile-modal').modal('open')
  }
  if (oauth === 'true') {
    oauthTrue()
  } else {
    oauthFalse()
  }
  if (reload !== 'true') {
    localStorage.removeItem('mapData')
    localStorage.removeItem('layers')
  }
  reloadTraining()

  $('predictorVis').val('natural')
  predictorVis(true)

  localStorage.removeItem('mapData')
}

$(document).ready(function () {
  $('.demo').minicolors({
    inline: true,
    change: function (hex, opacity) {
      updateRGB()
    },
    theme: 'default'
  })
  document.querySelector('.advContainer').addEventListener('change', function () {
    var hex = [
      Math.max(Math.min(parseInt($('.advContainer .input-field input#r').val()), 255), 0).toString(16),
      Math.max(Math.min(parseInt($('.advContainer .input-field input#g').val()), 255), 0).toString(16),
      Math.max(Math.min(parseInt($('.advContainer .input-field input#b').val()), 255), 0).toString(16)
    ]
    $.each(hex, function (nr, val) {
      if (val.length === 1) hex[nr] = '0' + val
    })
    $('#colourTemplate .demo').minicolors('value', '#' + hex.join(''))
  })
  $('#csv').on('change', function () {
    buildTrainingCSV()
    this.value = null
  })
  $('#json').on('change', function () {
    buildTrainingJSON()
    this.value = null
  })
  $('#kml').on('change', function () {
    buildTrainingKML()
    this.value = null
  })
  // Materialize initializations:
  $('.button-collapse').sideNav()
  $('select').material_select()
})

/* Initialises a region on the map. */
function initRegion () {
  // resets the old region if there is one
  if(region) {
    region.setMap(null)
  }
  var polyCoords = [
    {'lat': -35.52359131926069, 'lng': 136.38815795898438},
    {'lat': -35.52359131926069, 'lng': 138.25308715820312},
    {'lat': -36.214641115198745, 'lng': 138.25308715820312},
    {'lat': -36.214641115198745, 'lng': 136.38815795898438}
  ]
  addRegionFocus(polyCoords, json=true)
}

/* Copied from google maps search example
    https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
 */
function initAutocomplete () {
  // Create the search box and link it to the UI element.
  var input = $('#search')[0]
  var searchBox = new google.maps.places.SearchBox(input)

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function () {
    searchBox.setBounds(map.getBounds())
  })

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces()

    if (places.length === 0) {
      return
    }

    // For each place, name and location.
    var bounds = new google.maps.LatLngBounds()
    places.forEach(function (place) {
      if (!place.geometry) {
        console.log('Returned place contains no geometry')
        return
      }

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport)
      } else {
        bounds.extend(place.geometry.location)
      }
    })
    map.fitBounds(bounds)
  })
}