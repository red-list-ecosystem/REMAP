/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the Map, adding layers, adding markers
*/

/* POSTS the training set to our server and adds the classification to the map layers */
function giveTraining () {
  refreshChart = true
  $('#spinner').show()
  $('#classify').text('4. Classifying!')
  var postData = buildPostData()
  // fire a post request with our training data to get the map id
  $('.button-collapse').sideNav('hide')
  $.post('/getmapdata',
    postData,
    addClassifiedMap, 'json')
    .fail(function (err) { // alert the user that something has gone wrong
      $('#spinner').hide()
      $('#classify').text('4. Classify!')
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
    function (data) { // build the chart
      $('#histchart').empty()
      buildChart(data)
    }, 'json').fail(function (err) {
      Materialize.toast(err.statusText/* + ': ' + err.responseJSON.message*/, 10000, 'rounded') // responseJSON is undefined
    }
  )
}
// constructs the chart from data
function buildChart (data) {
  var fix = function(x) { return Math.round(x/10000) }

  var chartArray = [['Class', 'Hectares', {role: 'style'}]].concat(
    classList.map(function (x, i) {
      return [ 
        x.name,
        fix(data.groups[i].classification), 
        'color: ' + x.colour
      ]
    }))
  // dont display NA area if it is less than 2 ha
  if (fix(data.groups[classList.length].classification) > 2) {
    chartArray.push([
      'Not classified',
      fix(data.groups[classList.length].classification),
      'color: #fff'
    ])
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
  var training = buildPostData()
  $.post('/getassessment',
    training,
    function (data){
      $('#assessmentResults').children().remove()
      $('#assessmentResults').append($('<table>')
        .append($('<tr>').append(
          $('<td>').append($('<b>').text('Area:')),
          $('<td>').text(data.area)
        ), $('<tr>').append(
          $('<td>').append($('<b>').text('EOO:')),
          $('<td>').text(data.eoo)
        ), $('<tr>').append(
          $('<td>').append($('<b>').text('Units:')),
          $('<td>').text(data.units)
        ))
      )
    },
    'json'
  ).fail(function(err) {
    // TODO: something more informative
    Materialize.toast('Assessment Error', 5000, 'rounded')
  })
}
/** constructs the data packet that we send to our server to get the
 - classified map
 - composition histogram
 - classification metrics
*/
function buildPostData () {
  var training = {}
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
        var polyCoords = [
          {lat: bounds.getNorthEast().lat() + 0.01, lng: bounds.getNorthEast().lng() + 0.01},
          {lat: bounds.getSouthWest().lat() - 0.01, lng: bounds.getNorthEast().lng() + 0.01},
          {lat: bounds.getSouthWest().lat() - 0.01, lng: bounds.getSouthWest().lng() - 0.01},
          {lat: bounds.getNorthEast().lat() + 0.01, lng: bounds.getSouthWest().lng() - 0.01}
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
  $('#modal3').modal('close')
  $('#csv')[0].click()
}

function uploadJSONClick () {
  $('#modal3').modal('close')
  $('#json')[0].click()
}

function uploadKMLClick () {
  $('#modal3').modal('close')
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
  return true
}
