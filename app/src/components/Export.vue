<template lang='pug'>
  md-list-item
    md-icon import_export
    span Export Data
    md-list-expand
      md-list-item(download='remap-points.csv', @click='downloadCSV')
        md-icon pin_drop
        span Download CSV
      md-list-item(download='remap-training.json', @click='downloadJSON')
        md-icon file_download
        span Download JSON
      md-list-item.md-disabled.noselect
        span To Download the GeoTIFF:
      md-list-item.md-disabled.noselect(v-if='!authReady')
        md-icon
          img(src='../assets/g-logo.png')
        span Loading...
        md-spinner(:md-size='20', md-indeterminate)
      md-list-item(v-if='authReady && !isSignedIn', @click='signInClick')
        md-icon
          img(src='../assets/g-logo.png')
        span Sign in with Google
      md-list-item#g-download(v-if='authReady', @click='downloadDrive', :disabled="(!isSignedIn) ? true : !exportReady")
        md-icon cloud_download
        span Drive export GeoTIFF
        md-spinner(:md-size='20', md-indeterminate, v-if="exportStatus === 'IN_PROGRESS'")
        md-icon#gtick(v-if="exportStatus === 'COMPLETED'") done
        md-icon#gcross(v-if="exportStatus === 'ERROR'") clear
      md-list-item(v-if='authReady && isSignedIn', @click='preSignOut')
        md-icon
          img(src='../assets/g-logo.png')
        span Sign out
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import store from '../store'
export default {
  name: 'export',
  store,
  computed: mapGetters([
    'classes',
    'isSignedIn'
  ]),
  data () {
    return {
      authReady: false,
      exportStatus: 'NOT_STARTED',
      exportReady: true
    }
  },
  mounted () {
    // get the google script for authentication
    var script = document.createElement('script')
    script.onload = () => {
      if (!window.gapi) {
        return void (console.error('No gapi included'))
      }
      this.auth()
    }
    script.src = 'https://apis.google.com/js/api:client.js'
    script.async = true
    script.defer = true
    document.getElementsByTagName('head')[0].appendChild(script)
  },
  methods: {
    ...mapGetters([
      'json',
      'mapData'
    ]),
    ...mapActions([
      'signIn',
      'signOut',
      'setGoogleObject'
    ]),
    auth () {
      window.gapi.load('auth2', () => {
        const g = window.gapi.auth2.init({
          client_id: '705714878286-qbg7sf892td0gkkeorv0m0frlu7qhmgv.apps.googleusercontent.com'
        })
        this.setGoogleObject(g)
        this.authReady = true
      })
    },
    doDownload (fileName, blob) {
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
    },
    downloadCSV () {
      var output = []
      output.push('lat,lng,label')
      this.classes.forEach(function (myClass) {
        var points = myClass.markers.map(a => [a.lat, a.lng, myClass.name])
        output = output.concat(points)
      })
      if (output.length === 1) {
        // it's just the header, don't bother downloading
        this.$toasted.show('No training data to download', { duration: 4000 })
        return
      }
      var blob = new Blob([output.join('\n')], { type: 'text/csv' })
      this.doDownload('remap_points.csv', blob)
    },
    downloadDrive () {
      this.exportReady = false
      this.$http.post('/api/export', this.mapData()).then(data => {
        this.exportReady = false
        setTimeout(this.poll, 10000)
        this.exportStatus = 'IN_PROGRESS'
      }).catch(err => {
        this.exportReady = true
        this.$toasted.show(`Error Exporting: ${err.body.message}`, { duration: 5000 })
      })
    },
    downloadJSON () {
      var blob = new Blob([this.json()], { type: 'application/json' })
      this.doDownload('remap_training.json', blob)
    },
    poll () {
      var vm = this
      vm.$http.get('/api/exportstatus')
        .catch(err => {
          console.error('polling error')
          console.error(err)
          setTimeout(vm.poll, 10000)
        })
        .then(response => {
          vm.exportStatus = response.body
          console.log(`polling result ${response.body}`)
          if (vm.exportStatus === 'IN_PROGRESS') {
            setTimeout(vm.poll, 10000)
          } else {
            if (vm.exportStatus === 'ERROR') {
              vm.$toasted('Error downloading from Drive.', { duration: 5000 })
            } else if (vm.exportStatus === 'COMPLETED') {
              vm.$toasted('Drive download completed!', { duration: 5000 })
            } else if (vm.exportStatus === 'NOT_STARTED') {
              vm.$toasted('Drive download did not start.', { duration: 5000 })
            } else {
              // should never be reached
              vm.$toasted('Sorry, something went wrong (' + vm.exportStatus + ').', { duration: 5000 })
            }

            vm.exportReady = true
          }
        })
    },
    signInClick () {
      window.gapi.auth2.getAuthInstance().grantOfflineAccess().then(authResult => {
        if (authResult.code) {
          // Send the code to the server
          this.$http.post('/oauth2callback', authResult)
            .then(_ => {
              this.signIn()
            })
            .catch(err => {
              console.error('Error with oauth2callback.')
              console.error(err)
              this.signOut()
            })
        }
      })
    },
    preSignOut () {
      this.exportReady = false
      this.$http.post('/api/signout').then(this.signOut)
    }
  }
}
</script>

<style scoped>
#gtick {
  color: green;
}
#gcross {
  color: red;
}
img {
  height: 24px;
  width: 24px;
}
.md-disabled {
  color: rgba(0, 0, 0, 0.54);
}
</style>
