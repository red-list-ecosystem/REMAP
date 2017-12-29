/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to classes
*/

function addClass (name) {
  name = typeof name === 'undefined' ? 'Class ' + (classList.length + 1) : name;
  var colour = classList.length < colours.length ? colours[classList.length] : '#ff0000'
  var item = {name: name, colour: colour, markers: []}
  classList.push(item)
  var classRow = $('#classTemplate').clone()[0]
  var element = classRow.content.children[0]
  element.id = classList.length - 1
  element.children[0].querySelector('div').style.background = item.colour
  element.children[0].querySelectorAll('span')[0].innerText = item.name
  $(element).insertBefore($('#classListEnd'))
  selectClassIDX(classList.length - 1)
  // add the class to the assessment select
  refreshAssessmentSelect()
}

function deleteClass () {
  var classNum = parseInt($('#modal2').val())
  if (confirm("Are you sure you want to delete '" + classList[classNum].name + "'?")) {
    for (var i = 0; i < classList[classNum].markers.length; i++) {
      classList[classNum].markers[i].setMap(null)
    }
    classList.splice(classNum, 1)
    var elementArray = $('.classVal')
    if (elementArray.eq(classNum).hasClass('active') && classNum > 0) {
      elementArray.eq(classNum - 1).addClass('active')
    } else if (classNum == 0) {
      elementArray.eq(1).addClass('active')
    }
    elementArray.eq(classNum).remove()
    if (classNum < elementArray.length) {
      for (var i = classNum + 1; i < elementArray.length; i++) {
        // to match the id number with the index in the classList array, decrement subsequent ids in the html
        elementArray.eq(i).attr('id', elementArray.eq(i).attr('id') - 1)
      }
    }
    closeColourModal()
  }
  refreshAssessmentSelect()
}

function editClass (event, element) {
  event.stopPropagation()
  var idx = parseInt($(element).parent().parent().attr('id')) // ew
  $('#modal2').val(idx)
  $('#modal2 #cname').val(classList[idx].name)
  $('#modal2 .demo').minicolors('value', classList[idx].colour)
  Materialize.updateTextFields()
  $('#modal2').modal('open')
}

function clearAllClasses() {
  // remove the markers from the map
  for (var i = 0; i < classList.length; i++) {
    for (var j = 0; j < classList[i].markers.length; j++) {
      classList[i].markers[j].setMap(null)
    }
  }
  classList = [] // reset the class list
}

// refreshes the assessment select in the assessment dropdown
function refreshAssessmentSelect() {
  $('#assessment_select').children().remove()
  classList.forEach( function (x, i) {
    $('#assessment_select').append(
      $('<option>', {
        value: i,
        text: x.name
      }))
  })
  $('#assessment_select').material_select()
}

function refreshClassesHTML() {
  $('.classVal').remove()
  for (var i = 0; i < classList.length; i++) {
    var classRow = $('#classTemplate').clone()[0]
    var element = classRow.content.children[0]
    element.id = i
    if (i === 0) {
      element.classList.add('active')
    } else {
      element.classList.remove('active')
    }
    element.children[0].querySelector('div').style.background = classList[i].colour
    element.children[0].querySelectorAll('span')[0].innerText = classList[i].name
    element.children[0].querySelectorAll('span')[1].innerText = classList[i].markers.length
    $(element).insertBefore($('#classListEnd'))
  }
}

function selectClass (element) {
  selectClassIDX(parseInt($(element).parent().attr('id')))
}

function selectClassIDX (idx) {
  $('.classVal.active').removeClass('active')
  $('.classVal:eq(' + idx + ')').addClass('active')
}

function setClass () {
  var classNum = parseInt($('#modal2').val())
  classList[classNum].name = $('#modal2 #cname').val()
  classList[classNum].colour = $('#modal2 .demo').minicolors('value')
  $('.classVal:eq(' + classNum + ') a .legend-colour').css({ background: classList[classNum].colour })
  $('.classVal:eq(' + classNum + ') a #className').html(classList[classNum].name)
  closeColourModal()
  for (var i = 0; i < classList[classNum].markers.length; i++) {
    classList[classNum].markers[i].setIcon(getIcon(classList[classNum].colour))
  }
  refreshAssessmentSelect()
}

// returns classList but the markers are converted to lat,lng tuples so they can be stringified
function getClasses () {
  var temp = []
  for (var i = 0; i < classList.length; i++) {
    var obj = {'name': classList[i].name, 'colour': classList[i].colour, 'markers': []}
    for (var j = 0; j < classList[i].markers.length; j++) {
      obj.markers.push([classList[i].markers[j].getPosition().lat(), classList[i].markers[j].getPosition().lng()])
    }
    temp.push(obj)
  }
  return temp
}

function closeColourModal () {
  $('#modal2').modal('close')
}

function updateRGB () {
  var rgbObject = $('.demo').minicolors('rgbObject')
  $('.advContainer .input-field input#r').val(rgbObject.r)
  $('.advContainer .input-field input#g').val(rgbObject.g)
  $('.advContainer .input-field input#b').val(rgbObject.b)
}

/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the Map, adding layers, adding markers
*/

/* POSTS the training set to our server and adds the classification to the map layers */
function giveTraining (past_) {
  past = past_ // set the global past object
  refreshChart = true
  $('#spinner').show()
  $('#classify').text('Classifying!')
  var postData = buildPostData()
  // fire a post request with our training data to get the map id
  $('.button-collapse').sideNav('hide')
  $.post('/getmapdata',
    postData,
    addClassifiedMap, 'json')
    .fail(function (err) { // alert the user that something has gone wrong
      $('#spinner').hide()
      $('#classify').text('Classify!')
      Materialize.toast(err.responseJSON.message, 10000, 'rounded')
    })
    .done(function () {
      // get the performance data.
      getPerformance(postData)
    })
}

// opens the results modal and builds the area histogram 
function moreResults() {
  $('#histchart').empty()
  $('#histchart').append(
    $('<div>').attr('class', 'container').text('Chart loading').append(
      $('<div>').attr('class', 'progress').append(
        $('<div>').attr('class', 'indeterminate'))))
  // open the results modal
  $('#modal1').modal('open')
  if(refreshChart)
    getHistData(buildPostData())
}

// get the histogram data and then calls build chart
function getHistData(postData) {
  refreshChart = false
  $.post('/gethistdata',
    postData,
    function (data, error) { // build the chart
      $('#histchart').empty()
      buildChart(data)
    }, 'json').fail(function (err) {
      Materialize.toast(err.statusText/* + ': ' + err.responseJSON.message*/, 10000, 'rounded') // responseJSON is undefined
      console.log(err)
    }
  )
}
// constructs the chart from data
function buildChart (data) {
  var fix = function(x) { return Math.round(x/1e4) }

  var chartArray = [['Class', 'Hectares', {role: 'style'}]].concat(
    classList.map(function (x, i) {
      return [ 
        x.name,
        fix(data.groups[i].classification), 
        'color: ' + x.colour
      ]
    }))
  // dont display NA area if it is less than 2 ha
  if (classList.length < data.groups.length) {
    // if the class list length is less than the number of areas returned then
    // a no data area has been calcualted
    if(fix(data.groups[classList.length].classification) > 2) {
      chartArray.push([
        'Not classified',
        fix(data.groups[classList.length].classification),
        'color: #fff'
      ])
    }
  }

  var chartData = new google.visualization.arrayToDataTable(chartArray)
  var chart = new google.visualization.ColumnChart($('#histchart')[0])
  var opts2 = {
    title: 'Area in Hectares (Estimate)',
    legend: { position: 'none' },
    width: $(window).width() * 0.75,
    height: $(window).height() * 0.8,
    hAxis: { slantedText: true, slantedTextAngle: 90 }
  }
  chart.draw(chartData, opts2)
}

function runAssessment () {
  $('#assessment_btn').addClass('disabled')
  $('#assessment-label').text(
    (past ? 'Past ' : '') +  $('#assessment_select :selected').text())
  $('#assessment-modal').modal('open')

  $('#assessment-loading').removeClass('hidden')
  $('#assessment-results-row').addClass('hidden')

  var training = buildPostData()
  $.post('/getassessment',
    training,
    function (data){
      // populate the results
      // console.log(data)
      $('#assessment-area').text(
        'Total Area: ' + data.area.toFixed(3) + ' ' + data.units
      )
      $('#assessment-eoo').text(
        'EOO: ' + data.eoo.toFixed(3) + ' ' + data.units
      )
      $('#assessment-aoo').text(
        'AOO: '+ data.aoo + ' Grids'
      )
      $('#assessment-aoo-1pc').text(
        'AOO 1%: ' + data.aoo_1pc + ' Grids'
      )
      $('#assessment-loading').addClass('hidden')
      $('#assessment-results-row').removeClass('hidden')
    },
    'json'
  ).fail(function(err) {
    $('#assessment-modal').modal('close')
    $('#assessment_btn').removeClass('disabled')
    console.log(err)
    // TODO: something more informative
    Materialize.toast('Assessment Error: '+ err.responseJSON.message, 5000, 'rounded')
  })
  .always(function() {
    $('#assessment_btn').removeClass('disabled')
  })
}
/** constructs the data packet that we send to our server to get the
 - classified map
 - composition histogram
 - classification metrics
*/
function buildPostData () {
  var training = {}
  training.past = past
    // get the region that the user has selected
  training.region = regionPath()
  training.selected = $('#assessment_select').val()
  training.predictors = $('#predictors').val()
  training.classList = classList.map(function (myClass, index) {
    var outClass = {}
    outClass.name = myClass.name
    outClass.lab = index + 1
    outClass.colour = myClass.colour.replace(/#/, '')
    outClass.points = myClass.markers.map(function(x) {return x.position.toJSON()})
    return outClass
  })
  return JSON.stringify(training).replace(/\\r/g, '')
}

function validateLatLngPair(pair) {
  // parseFloat isn't used because it will cast '12.3s45' into 12.3
  // +(string) converts the whole string to a float or NaN
  if (pair instanceof Array) {
    return !isNaN(+(pair[0])) && !isNaN(+(pair[1]))
  } else {
    return !isNaN(+(pair['lat'])) && !isNaN(+(pair['lng']))
  }
}

/* validate the line format of <lat>, <lng>, <label> */
function validateLine(line) {
  if (line.length != 3) {
    return false
  }
  return validateLatLngPair(line.slice(0, 2))
}

/*  Builds a training region from a kml */
function buildTrainingKML () {
  var reader = new FileReader()
  var file = $('#kml')[0].files[0]

  reader.onloadend = function (evt) {
    if (evt.target.readyState === FileReader.DONE) {
      try {
        var kml = $.parseXML(evt.target.result)
      } catch (err) {
        Materialize.toast('Error: Invalid KML', 5000, 'rounded')
        console.log(err)
        return
      }
      var geoJSON = toGeoJSON.kml(kml)
      addRegionFocus(geoJSON.features[0].geometry.coordinates[0])
    }
  }
  reader.readAsText(file)
  $('#modal3').modal('close')
}

/*  Builds a training set from a csv */
function buildTrainingCSV () {
  var reader = new FileReader()
  var file = $('#csv')[0].files[0]

  reader.onloadend = function (evt) {
    if (evt.target.readyState === FileReader.DONE) {
      var text = evt.target.result
      var lines = text.split('\n').filter(function (x) {
        return x !== '' // remove empty lines
      })
      clearAllClasses()
      // remove the class rows
      $('.classVal').remove()
      var invalidCount = 0, outsideCount = 0
      var changeRegion = $('#regionChangeCheckbox').prop('checked')
      var bounds = new google.maps.LatLngBounds()
      for (var i = 1; i < lines.length; i++) { // do we want to remove the header line from the CSV?
        var line = lines[i].split(',')
        line[2] = line[2].trim()
        if (validateLine(line)) {
          if (changeRegion || google.maps.geometry.poly.containsLocation(new google.maps.LatLng(line[0], line[1]), region)) {
            var classIndex = classList.findIndex(function(e) { return e.name === line[2]})
            if (classIndex === -1) {
              addClass(line[2])
              classIndex = classList.length - 1
            }
            var badge = $('li#' + classIndex + ' a .badge')
            badge.text(parseInt(badge.text()) + 1)
            var marker = new google.maps.Marker({
              position: {lat: parseFloat(line[0]), lng: parseFloat(line[1])},
              map: map,
              draggable: true,
              icon: getIcon(classList[classIndex].colour)
            })
            classList[classIndex].markers.push(marker)
            if (changeRegion) {
              bounds.extend(new google.maps.LatLng(parseFloat(line[0]), parseFloat(line[1])))
            }
          } else {
            outsideCount++
          }
        } else {
          invalidCount++
        }
      }
      if (changeRegion) {
        map.fitBounds(bounds)
        // adds a buffer
        var polyCoords = [
          {lat: bounds.getNorthEast().lat() + mapBuffer, lng: bounds.getNorthEast().lng() + mapBuffer},
          {lat: bounds.getSouthWest().lat() - mapBuffer, lng: bounds.getNorthEast().lng() + mapBuffer},
          {lat: bounds.getSouthWest().lat() - mapBuffer, lng: bounds.getSouthWest().lng() - mapBuffer},
          {lat: bounds.getNorthEast().lat() + mapBuffer, lng: bounds.getSouthWest().lng() - mapBuffer}
        ]
        addRegion(polyCoords)
      }
      if (invalidCount != 0) {
        Materialize.toast(invalidCount + ' points omitted from CSV for being invalid.', 5000, 'rounded')
      }
      if (outsideCount != 0) {
        Materialize.toast(outsideCount + ' points omitted from CSV for being outside the region.', 5000, 'rounded')
      }
    }
  }
  reader.readAsText(file)
  $('#modal3').modal('close')
}

/* Builds a training set from a json */
function buildTrainingJSON () {
  var reader = new FileReader()
  var file = $('#json')[0].files[0]

  reader.onloadend = function (evt) {
    if (evt.target.readyState === FileReader.DONE) {
      loadFromJSON(evt.target.result)
    }
  }
  reader.readAsText(file)
  $('#modal3').modal('close')
  
}

function getPerformance (postData) {
  $.post('/getperformance',
    postData,
    function (data) {
      $('#results').empty()
      $('#resultsTable').empty()
      $('#resultsList').empty()
      $('#resultsList').append(
        $('<a class="btn" onClick="moreResults()">More</a>'))

      var toPercent = function(x) { return String(x * 100).substr(0, 6) + '%'; }
      var dataTooltip = {
        tooltip: 'Resubstitution Accuracy is a measure of how well the model performs when built on all of the training set.',
        position: 'right'
      }
      $('#results')
      .append($('<a>').text('Resubstitution Accuracy: ' + toPercent(data.accuracy)).tooltip(dataTooltip))
      
      $('#resultsTable')
        .append($('<thead>').append($('<tr>').append([
          $('<th>').text('Class'),
          $('<th>').text('Consumers Accuracy'),
          $('<th>').text('Producers Accuracy')
        ])))
        .append($('<tbody>').append(classList.map(
          function(x, i) {
            return $('<tr>').append([
              $('<td>').text(x.name),
              $('<td>').text(toPercent(data.consumers_accuracy[0][i + 1])),
              $('<td>').text(toPercent(data.producers_accuracy[i + 1][0]))
            ])
          }
        )).append($('<tr>').append([
          $('<td>').append($('<b>').text('Resubstitution Accuracy')),
          $('<td>').append($('<b>').text(toPercent(data.accuracy)))
        ]))
      )
    }, 'json')
}

function doDownload(fileName, blob) {
  var reader = new FileReader()
  reader.onload = function (e) {
    if (window.navigator.msSaveOrOpenBlob) {
      navigator.msSaveBlob(blob, fileName)
    } else {
      var downloadLink = document.createElement('a')
      downloadLink.href = window.URL.createObjectURL(blob)
      downloadLink.download = fileName
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
    }
  }
  reader.readAsDataURL(blob)
}

/* Downloads the training set and region into a JSON */
function dataDownload () {
  var blob = new Blob([getMapJSON()], {type: "application/json"})
  doDownload('remap_training.json', blob)
}

/* Downloads the training set csv */
function prepareDownload () {
  var output = []
  output.push('lat,lng,label')
  classList.forEach(function (myClass) {
    var points = myClass.markers.map(function(a){ return a.position.toJSON()})
    points = points.map(function(a) { return [ a.lat, a.lng, myClass.name ]})
    output = output.concat(points)
  })
  if (output.length === 1) {
    // it's just the header, don't bother downloading
    Materialize.toast('No training data to download', 4000, 'rounded')
    return
  }
  var blob = new Blob([output.join('\n')], {type: 'text/csv'})
  doDownload('remap_points.csv', blob)
}

function resetTraining () {
  if (confirm("Are you sure you want to clear all training data?")) {
    clearAllClasses()
    addClass()
    refreshClassesHTML()
    region.setMap(null)
    initRegion()
  }
}

function uploadClick () {
  $('#csv')[0].click()
}

function uploadJSONClick () {
  $('#json')[0].click()
}

function uploadKMLClick () {
  $('#kml')[0].click()
}

/* Downloads the image to Drive */
function downloadDrive () {
  var postData = buildPostData()
  $('#g-download a').addClass('subheader')
  Materialize.toast('Starting download. This may take a few minutes.', 5000, 'rounded')
  $('#gtick').hide()
  $('#gcross').hide()
  $('#gspinner').show()
  $.post('/export', postData, 'json')
    .fail(function (err) {
      $('#gspinner').hide()
      $('#gcross').show()
      $('#g-download a').removeClass('subheader')
      Materialize.toast('Error downloading to Drive.', 5000, 'rounded')
    })
    .done(function () {
      downloadLoop()
    })
}

function downloadLoop () {
  $.get('/export')
    .fail(function (err) {
      // what does a fail mean in this case? probably just try again?
      console.log(err)
      setTimeout(downloadLoop, 10000)
    })
    .done(function (data) {
      if (data == 'IN_PROGRESS') {
        setTimeout(downloadLoop, 10000)
      } else {
        $('#gspinner').hide()
        $('#g-download a').removeClass('subheader')
        if (data == 'ERROR') {
          $('#gcross').show()
          Materialize.toast('Error downloading from Drive.', 5000, 'rounded')
        } else if (data == 'COMPLETED') {
          $('#gtick').show()
          Materialize.toast('Drive download completed!', 5000, 'rounded')
        } else if (data == 'NOT_STARTED') {
          Materialize.toast('Drive download did not start.', 5000, 'rounded')
        } else {
          // should never be reached
          Materialize.toast('Sorry, something went wrong (' + data + ').', 5000, 'rounded')
        }
      }
    })
}

function validateJSON (json) {
  if (!('region' in json)) {
    return false
  }
  // TODO: region might have <3 coordinates (no enclosing area)
  for (var i = 0; i < json.region.length; i++) {
    if (!validateLatLngPair(json.region[i])) {
      return false
    }
  }
  if (!('classes' in json)) {
    return false
  }
  for (var i = 0; i < json['classes'].length; i++) {
    if (!('colour' in json['classes'][i])) {
      return false
    }
    if (!('markers' in json['classes'][i])) {
      return false
    }
    for (var j = 0; j < json['classes'][i]['markers'].length; j++) {
      if (!validateLatLngPair(json['classes'][i]['markers'][j])) {
        return false
      }
    }
  }
  return true
}

/**
  Loads a data set from JSON.
  returns true if successful, false otherwise
*/
function loadFromJSON (data) {
  clearAllClasses()
  if (region) {
    region.setMap(null)
  }
  var jsonData = null
  try {
    jsonData = JSON.parse(data)
  } catch (err) {
    Materialize.toast(err.message, 5000, 'rounded')
    return false
  }
  if (!validateJSON(jsonData)) {
    Materialize.toast('Error in your JSON input. Please check the format.', 5000, 'rounded')
    return false
  }
  addRegionFocus(jsonData.region, json=true)

  classList = jsonData.classes
  refreshClassesHTML()
  for (var i = 0; i < classList.length; i++) {
    for (var j = 0; j < classList[i].markers.length; j++) {
      classList[i].markers[j] = new google.maps.Marker({
        position: new google.maps.LatLng(classList[i].markers[j][0], classList[i].markers[j][1]),
        map: map,
        draggable: true,
        icon: getIcon(classList[i].colour)
      })
    }
  }
  refreshAssessmentSelect()
  return true
}

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
    zoomControl: false,
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
/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the Map, adding layers, adding markers
*/

function addLayerControl (layerNum, label, classification) {
  var slider = document.createElement('div')
  noUiSlider.create(slider, {
    start: 100,
    connect: [true, false],
    range: {
      'min': 0,
      'max': 100
    },
    step: 1,
    format: wNumb({ decimals: 0 })
  })
  slider.noUiSlider.on('update', function (values, handle) {
    map.overlayMapTypes.getAt(layerNum - 1).setOpacity(parseInt(values[0]) / 100)
  })
  var selector = classification ? '#classification-control' : '#predictor-control'
  $(selector).empty().append(
    $('<label>').text(label).append(
    $('<div>').attr('class', '.no-ui-slider').append(slider)
  ))
}

/**
  Gets the predictor layer from the server.
  If reset is true we will ask the server to re-calculate visualization parameters.
*/
function predictorVis (reset) {
  var select = $('#predictorVis')
  var val = select.val()
  var postData = {
    predictor: val,
    region: regionPath(),
    sigma: Number($('#sigma').val())
  }
  if (!reset) {
    postData.mean = vis.mean
    postData.total_sd = vis.total_sd
  }
  if(val === 'natural' || val === 'past-natural'){
    if(!$('#sigma-div').hasClass('hidden')){
      $('#sigma-div').addClass('hidden')
    }
  } else if($('#sigma-div').hasClass('hidden')){
    $('#sigma-div').removeClass('hidden')
  }
  // set the select to disabled while we send the request for the vis layer
  select.prop('disabled', true)
  select.material_select()
  $('#spinner').show()
  $.post(
    '/getpredictorlayer',
    JSON.stringify(postData),
    function (data) {
      $('#spinner').hide()
      var eeMapOptions = {
        getTileUrl: buildGetTileUrl(data.mapid, data.token),
        tileSize: new google.maps.Size(256, 256)
      }
      // Create the map type.
      var mapType = new google.maps.ImageMapType(eeMapOptions)
      if (map.overlayMapTypes.length === 0) {
        map.overlayMapTypes.push(mapType)
      } else {
        map.overlayMapTypes.setAt(0, mapType)
      }
      addLayerControl(1, 'Predictor: ' +  $('#predictorVis option:selected').text(), false)
      var layers = localStorage.getItem('layers')
      if (layers != null) {
        addClassifiedMap(JSON.parse(layers))
        localStorage.removeItem('layers')
      }
      vis.mean = data.mean
      vis.total_sd = data.total_sd
    }, 'json').fail(
    function (err) {
      console.log(err)
      Materialize.toast('Failed to get predictor layer.', 10000, 'rounded')
    }).always(function () { 
      // re-enable the predictor selector
      $('#sigma').material_select()
      select.prop('disabled', false)
      select.material_select()
    })
}

/** Higher order function that allows for google maps to request for tiles of a map type.
*/
function buildGetTileUrl (mapid, token) {
  return function (tile, zoom) {
    var baseUrl = 'https://earthengine.googleapis.com/map'
    return [baseUrl, mapid, zoom, tile.x, tile.y].join('/') + '?token=' + token
  }
}

/*
* Allows a user to add markers of a class by clicking on the map.
*/
function addMarkers () {
  if (listenerHandle === false) {
    $('#map div .gm-style div').css('cursor', 'crosshair')
    $('#addMarkers').addClass('active')
    region.setEditable(false)
    listenerHandle = google.maps.event.addListener(map, 'click', function (event) {
      if (google.maps.geometry.poly.containsLocation(event.latLng, region)) {
        // add the event marker
        var idx = parseInt($('.classVal.active').attr('id'))
        var badge = $('li#' + idx + ' a .badge')
        badge.text(parseInt(badge.text()) + 1)
        var marker = new google.maps.Marker({
          position: event.latLng,
          map: map,
          draggable: true,
          icon: getIcon(classList[idx].colour)
        })
        classList[idx].markers.push(marker)
      } else {
        Materialize.toast('Please focus region before training a classification.', 2000, 'rounded')
      }
    })
    $('.button-collapse').sideNav('hide')
  } else {
    $('#map div .gm-style div').css('cursor', '')
    $('#addMarkers').removeClass('active')
    region.setEditable(true)
    google.maps.event.removeListener(listenerHandle)
    listenerHandle = false
  }
}

// toggles the markers visibility on the map
function markerVisibility () {
  var button = $('#marker-toggle')
  var toggle = button.attr('data') === '1'
  classList.forEach(function(x) {
    x.markers.forEach(function(y) {
      y.setVisible(toggle)
    })
  })
  button.attr('data', toggle ? '0' : '1')
}

function addClassifiedMap (data) {
  $('#spinner').hide()
  localStorage.setItem('layers', JSON.stringify(data))
  data.forEach(function (layer, i) {
    var eeMapOptions = {
      getTileUrl: buildGetTileUrl(layer.mapid, layer.token),
      tileSize: new google.maps.Size(256, 256)
    }
    // Create the map type.
    layer.label = (past ? "1999-2003":"2014-2017") + ": " + layer.label
    var mapType = new google.maps.ImageMapType(eeMapOptions)
    if (!classified) {
      classified = true
      map.overlayMapTypes.push(mapType)
      addLayerControl(map.overlayMapTypes.length, layer.label, true)
    } else {
      map.overlayMapTypes.pop()
      map.overlayMapTypes.push(mapType)
      addLayerControl(map.overlayMapTypes.length, layer.label, true)
    }
  })
  $('#classify').text('4. Reclassify!')
}

function getIcon(colour) {
  return {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor: colour,
      fillOpacity: 0.6,
      strokeColor: 'white',
      strokeWeight: 0.5,
      scale: 4
    }
}

function getMapJSON () {
  return JSON.stringify({
    'classes': getClasses(),
    'region': getRegion()
  })
}

function loginClick () {
  window.onbeforeunload = null; // turn off the confirmation for the login redirect
  localStorage.setItem('mapData', getMapJSON())
}

/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the oauth for image downloading
*/

function oauthFalse () {
  $('#g-sign-in').show()
  $('#g-download .waves-effect').addClass('subheader')
  $('#g-sign-out').hide()
}

function oauthTrue () {
  $('#g-sign-in').hide()
  $('#g-download .waves-effect').removeClass('subheader')
  $('#g-sign-out').show()
}

function reloadTraining () {
  var mapData = localStorage.getItem('mapData')
  if (mapData != null) {
    loadFromJSON(mapData)
  } else {
    addClass()
    initRegion()
  }
}

function signOutShared () {
  $.post('/logout')
  $('#g-sign-in').show()
  $('#g-download .waves-effect').addClass('subheader')
  $('#g-sign-out').hide()
  $('#useremail').text('Not signed in.')
}

function signOut () {
  signOutShared()
}

function signOutChange () {
  signOutShared()
  var ourl = $('#g-sign-in a').attr('href')
  var oarr = ourl.split('&')
  for (var i = 0; i < oarr.length; i++) {
    if (oarr[i] == 'access_type=offline') {
      if (i == oarr.length - 1) {
        oarr.push('approval_prompt=force')
      } else if (oarr[i + 1] != 'approval_prompt=force') {
        oarr.splice(i + 1, 0, 'approval_prompt=force')
      }
      break
    }
  }
  var newourl = oarr.join('&')
  $('#g-sign-in a').attr('href', newourl)
  $('#g-sign-in a')[0].click()
}
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
