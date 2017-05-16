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
  $('#g-download .waves-effect').addClass('subheader')
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

function signOut () {
  $.post('/logout')
  $('#g-sign-in').show()
  $('#g-download .waves-effect').addClass('subheader')
  $('#g-sign-out').hide()
}
