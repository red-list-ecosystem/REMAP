/**
 Daniel Simpson,
 John Wilshire

 2017

 Functions related to the Map, adding layers, adding markers
*/

/* POSTS the training set to our server and adds the classification to the map layers */
function giveTraining () {
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
      $('#results').empty()
      $('#resultsTable').empty()
      getPerformance(postData)
      $('#histchart').empty()
      $('#histchart2').empty()
      $('#histchart').append(
        $('<div>').attr('class', 'container').text('Chart loading').append(
          $('<div>').attr('class', 'progress').append(
            $('<div>').attr('class', 'indeterminate'))))

      // get the histogram data
      $.post('/gethistdata',
        postData,
        function (data) { // build the chart
          $('#histchart').empty()
          buildChart(data)
        }, 'json').fail(function (err) {
          Materialize.toast(err.statusText/* + ': ' + err.responseJSON.message*/, 10000, 'rounded') // responseJSON is undefined
        })
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
      var invalidCount = 0
      var outsideCount = 0
      for (var i = 1; i < lines.length; i++) { // do we want to remove the header line from the CSV?
        var line = lines[i].split(',')
        line[2] = line[2].trim()
        if (validateLine(line)) {
          if (google.maps.geometry.poly.containsLocation(new google.maps.LatLng(line[0], line[1]), region)) {
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
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: classList[classIndex].colour,
                fillOpacity: 0.6,
                strokeColor: 'white',
                strokeWeight: 0.5,
                scale: 4
              }
            })
            classList[classIndex].markers.push(marker)
          } else {
            invalidCount++
          }
        } else {
          outsideCount++
        }
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
      var dataAcc = String(data.accuracy * 100).substr(0, 6) + '%'
      var dataTooltip = {
        tooltip: 'Resubstitution Accuracy is a measure of how well the model performs when built on all of the training set.',
        position: 'right'
      }
      data.producers_accuracy.shift() // remove the empty class
      var prodArr = data.producers_accuracy.map(function (x, i) {
        return [classList[i].name, + String(x * 100).substr(0, 6) + '%']
      })
      data.consumers_accuracy[0].shift()
      var consArr = data.consumers_accuracy[0].map(function (x, i) {
        return [classList[i].name, + String(x * 100).substr(0, 6) + '%']
      })
      $('#results')
      .append($('<a>').text('Resubstitution Accuracy: ' + dataAcc).tooltip(dataTooltip))
      .append($('<a>').text('Producers Accuracy: '))
      .append(prodArr.map(function (x) { return $('<a>').text(x.join(' ')) }))
      .append($('<a>').text('Consumers Accuracy: '))
      .append(consArr.map(function (x) { return $('<a>').text(x.join(' ')) }))

      $('#resultsTable')
      .append($('<thead>').append($('<tr>')))
      .append($('<tbody>'))
      $('#resultsTable thead tr')
      .append($('<th>').text('Accuracy'))
      .append(prodArr.map(function (x) { return $('<th>').text(x[0]) }))
      $('#resultsTable tbody').append($('<tr>')).append($('<tr>'))
      $('#resultsTable tbody tr').eq(0)
      .append($('<td>').text('Producers Accuracy'))
      .append(prodArr.map(function (x) { return $('<td>').text(x[1]) }))
      $('#resultsTable tbody tr').eq(1)
      .append($('<td>').text('Consumers Accuracy'))
      .append(consArr.map(function (x) { return $('<td>').text(x[1]) }))
    }, 'json')
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

// constructs the chart from data
function buildChart (data) {
  var data2 = new google.visualization.arrayToDataTable(
  [['Class', 'Hectares', {role: 'style'}]].concat(
    classList.map(function (x, i) {
      return [x.name, data.classification[String(i + 1)], 'color: ' + x.colour]
    })
  ))
  var chart = new google.visualization.ColumnChart($('#histchart')[0])
  var opts = {
    title: 'Area in Hectares',
    legend: { position: 'none' },
    width: 300
  }
  chart.draw(data2, opts)
  var chart2 = new google.visualization.ColumnChart($('#histchart2')[0])
  var opts2 = {
    title: 'Area in Hectares',
    legend: { position: 'none' },
    width: $(window).width() * 0.75,
    height: $(window).height() * 0.8
  }
  chart2.draw(data2, opts2)
  $('#histchart').on('click', function () {
    $('#modal1').modal('open')
  })
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
      $('#gspinner').hide()
      $('#gtick').show()
      $('#g-download a').removeClass('subheader')
      Materialize.toast('Drive download completed!', 5000, 'rounded')
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
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: classList[i].colour,
          fillOpacity: 0.6,
          strokeColor: 'white',
          strokeWeight: 0.5,
          scale: 4
        }
      })
    }
  }
  return true
}
