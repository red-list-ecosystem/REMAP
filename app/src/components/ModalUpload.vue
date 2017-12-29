<template lang='pug'>
  modal(name='uploadModal', width='760px', height='auto', :pivot-y='0.1')
    .inner
      h4 Upload Data
      md-layout(md-gutter='24')
        md-layout(md-flex='33', md-align='center')
          h5 CSV
        md-layout(md-flex='33', md-align='center')
          h5 JSON
        md-layout(md-flex='33', md-align='center')
          h5 KML
      md-layout(md-gutter='24')
        md-layout(md-flex='33')
          p Upload a <code>.csv</code> file of your points. The columns should be in the order: latitude, longitude and class. Where Latitude and Longitude are in WGS84 and class is the ecosystem label.
        md-layout(md-flex='33')
          p Upload a <code>.json</code> file of your training data, Choose this option if you have previously used REMAP and exported the data as a json.
        md-layout(md-flex='33')
          p Upload a <code>.KML</code> file of your region of interest. If you have a specific region that you have a .KML for you can upload it and the region will clip to it.
      md-layout(md-gutter='24')
        md-layout(md-flex='33', md-align='center')
          md-checkbox(v-model='changeRegion') Change region to fit points
      md-layout(md-gutter='24')
        md-layout(md-flex='33', md-align='center')
          md-button.md-accent.md-raised(@click='uploadClick("csv")') Upload CSV
            input#csv.hidden(type='file', accept='.csv', tabindex='-1', ref='csvBtn', @change='upload("CSV", $event)')
        md-layout(md-flex='33', md-align='center')
          md-button.md-accent.md-raised(@click='uploadClick("json")') Upload JSON
            input#json.hidden(type='file', accept='.json', tabindex='-1', ref='jsonBtn', @change='upload("JSON", $event)')
        md-layout(md-flex='33', md-align='center')
          md-button.md-accent.md-raised(@click='uploadClick("kml")') Upload KML
            input#kml.hidden(type='file', accept='.kml, .kmz, .xml', tabindex='-1', ref='kmlBtn', @change='upload("KML", $event)')
</template>

<script>
var toGeoJSON = require('togeojson')
import { mapActions, mapGetters } from 'vuex'
import store from '../store'

export default {
  name: 'modal-upload',
  store,
  computed: mapGetters([
    'classes',
    'region'
  ]),
  data () {
    return {
      changeRegion: true
    }
  },
  methods: {
    ...mapActions([
      'addClass',
      'addMarker',
      'clearClasses',
      'selectClass',
      'setClasses',
      'setRegion',
      'setRegionFocus',
      'setBounds'
    ]),
    loadFromCSV: function (text) {
      var lines = text.split('\n').filter(function (x) {
        return x !== '' // remove empty lines
      })
      var invalidCount = 0
      var outsideCount = 0
      var bounds = new window.google.maps.LatLngBounds()
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i].split(',')
        line[2] = line[2].trim()
        if (this.validateLine(line)) {
          line[0] = parseFloat(line[0])
          line[1] = parseFloat(line[1])
          if (this.changeRegion || window.google.maps.geometry.poly.containsLocation(new window.google.maps.LatLng(line[0], line[1]), new window.google.maps.Polygon({ paths: this.region }))) {
            var classIndex = this.classes.findIndex(function (e) { return e.name === line[2] })
            if (classIndex === -1) {
              this.addClass(line[2])
            } else {
              this.selectClass(classIndex)
            }
            this.addMarker({ lat: line[0], lng: line[1] })
            if (this.changeRegion) {
              bounds.extend(new window.google.maps.LatLng(line[0], line[1]))
            }
          } else {
            outsideCount++
          }
        } else {
          invalidCount++
        }
      }
      if (this.changeRegion) {
        var mapBuffer = 0.01
        var polyCoords = [
          { lat: bounds.getNorthEast().lat() + mapBuffer, lng: bounds.getNorthEast().lng() + mapBuffer },
          { lat: bounds.getSouthWest().lat() - mapBuffer, lng: bounds.getNorthEast().lng() + mapBuffer },
          { lat: bounds.getSouthWest().lat() - mapBuffer, lng: bounds.getSouthWest().lng() - mapBuffer },
          { lat: bounds.getNorthEast().lat() + mapBuffer, lng: bounds.getSouthWest().lng() - mapBuffer }
        ]
        this.setRegion(polyCoords)
        this.setBounds(bounds)
      }
      if (invalidCount !== 0) {
        this.$toasted.show(invalidCount + ' points omitted from CSV for being invalid.', { duration: 5000 })
      }
      if (outsideCount !== 0) {
        this.$toasted.show(outsideCount + ' points omitted from CSV for being outside the region.', { duration: 5000 })
      }
    },
    loadFromJSON: function (text) {
      var jsonData = null
      try {
        jsonData = JSON.parse(text)
      } catch (err) {
        this.$toasted.show(err.message, { duration: 5000 })
        return false
      }
      if (!this.validateJSON(jsonData)) {
        this.$toasted.show('Error in your JSON input. Please check the format.', { duration: 5000 })
        return false
      }
      this.setRegionFocus(jsonData.region)
      this.setClasses(jsonData.classes)
      return true
    },
    loadFromKML: function (text) {
      var geoJSON = null
      try {
        var kml = new DOMParser().parseFromString(text, 'text/xml')
        geoJSON = toGeoJSON.kml(kml)
      } catch (err) {
        this.$toasted.show('Error: Invalid KML', { duration: 5000 })
        return
      }
      for (let feature of geoJSON.features) {
        if (feature.geometry.type === 'Polygon') {
          var polyCoords = feature.geometry.coordinates[0].map(pt => ({ lat: pt[1], lng: pt[0] }))
          this.setRegionFocus(polyCoords)
          break
        }
      }
    },
    upload: function (name, event) {
      var reader = new FileReader()
      var file = event.target.files[0]

      reader.onloadend = function (evt) {
        if (evt.target.readyState === FileReader.DONE) {
          switch (name) {
            case 'CSV':
              this.clearClasses()
              this.loadFromCSV(evt.target.result)
              break
            case 'JSON':
              this.clearClasses()
              this.loadFromJSON(evt.target.result)
              break
            case 'KML':
              this.loadFromKML(evt.target.result)
              break
            default:
              break
          }
        }
      }.bind(this)

      reader.readAsText(file)
      this.$modal.hide('uploadModal')
    },
    uploadClick: function (name) {
      this.$refs[name + 'Btn'].click()
    },
    validateJSON: function (json) {
      if (!('region' in json)) {
        return false
      }
      if (json.region.length < 3) {
        return false
      }
      for (var i = 0; i < json.region.length; i++) {
        if (!this.validateLatLngPair(json.region[i])) {
          return false
        }
      }
      if (!('classes' in json)) {
        return false
      }
      for (i = 0; i < json.classes.length; i++) {
        if (!('colour' in json.classes[i])) {
          return false
        }
        if (!('markers' in json.classes[i])) {
          return false
        }
        for (var j = 0; j < json.classes[i].markers.length; j++) {
          if (!this.validateLatLngPair(json.classes[i].markers[j])) {
            return false
          }
        }
      }
      return true
    },
    validateLatLngPair: function (pair) {
      // parseFloat isn't used because it will cast '12.3s45' into 12.3
      // +(string) converts the whole string to a float or NaN
      if (pair instanceof Array) {
        return !isNaN(+(pair[0])) && !isNaN(+(pair[1]))
      } else {
        return !isNaN(+(pair['lat'])) && !isNaN(+(pair['lng']))
      }
    },
    validateLine: function (line) {
      if (line.length !== 3) {
        return false
      }
      return this.validateLatLngPair(line.slice(0, 2))
    }
  }
}
</script>

<style>
h4 {
  font-size: 2.28rem;
  font-weight: 300;
  margin-bottom: 14px;
  margin-top: 0;
  text-align: center;
}

h5 {
  font-size: 24px;
  font-weight: 300;
  margin: 15px 0;
}

.inner {
  padding: 24px;
}
</style>