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