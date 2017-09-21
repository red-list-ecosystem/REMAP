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
