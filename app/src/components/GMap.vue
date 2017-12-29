<template lang='pug'>
  gmap-map.gmap(
    ref="googlemap"
    :center="viewCentre"
    :zoom="viewZoom"
    :map-type-id="mapType"
    :options="options"
    :class="{ adding: editing }"
    @click="clicked"
    @tilesloaded="loaded"
  )

    gmap-polygon(
      ref="polygon"
      :paths="region"
      :editable="true"
      :options="polygonOptions"
      @paths_changed="updateEdited($event)"
    )

    div(v-for="(c, classIndex) in classes")
      gmap-marker(
        v-for="(m, markerIndex) in c.markers"
          :position="m"
          :icon="getIcon(c.colour)"
          :key="markerIndex"
          :opacity="getOpacity()"
          :draggable="markerOptions.draggable"
          @dblclick="deleteMarker({ classIndex: classIndex, markerIndex: markerIndex })"
      )
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { myMap } from 'vue2-google-maps'
import store from '../store'

export default {
  name: 'g-map',
  store,
  computed: {
    ...mapGetters([
      'classes',
      'editing',
      'focusToggle',
      'mapLayerOpacity',
      'mapLayers',
      'region',
      'showMarkers',
      'viewBounds',
      'viewCentre',
      'viewZoom',
      'maxRegionSize'
    ]),
    opacityArray () {
      return this.mapLayers.map(obj => obj ? obj.opacity : 100)
    },
    visArray () {
      return this.mapLayers.map(obj => obj.visualized)
    }
  },
  data () {
    return {
      center: this.viewCentre,
      zoom: this.viewZoom,
      mapType: 'satellite',
      options: {
        mapTypeControlOptions: {
          position: 3 // window.google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          position: 1
        },
        scaleControl: true,
        streetViewControl: false
      },
      polygonOptions: {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.05,
        editable: true,
        geodesic: true,
        clickable: false
      },
      markerOptions: {
        draggable: true
      }
    }
  },
  components: { myMap },
  watch: {
    opacityArray () {
      this.updateOpacity()
    },
    visArray () {
      this.updateOpacity()
    },
    mapLayers: function () {
      var vm = this
      this.mapLayers
        .map(function (layer, i) {
          var eeMapOptions = {
            getTileUrl: (tile, zoom) => [
              'https://earthengine.googleapis.com/map',
              layer.mapid,
              zoom,
              tile.x,
              tile.y
            ].join('/') + '?token=' + layer.token,
            tileSize: new window.google.maps.Size(256, 256)
          }
          // Create the map type.
          var mapType = new window.google.maps.ImageMapType(eeMapOptions)
          vm.$refs.googlemap.$mapObject.overlayMapTypes.setAt(i, mapType)
        })
    },
    region: function () {
      if (this.region.length === 0) {
        this.initRegion()
      } else if (window.google) {
        var regionArea = window.google.maps.geometry.spherical.computeArea(
          this.$refs.polygon.$polygonObject.getPath()
        ) / 1e6
        if (regionArea > this.maxRegionSize) {
          this.$toasted.show(`Your regions area (${regionArea.toFixed(2)} km^2) exceeds the limit of ${this.maxRegionSize} km^2.`, { duration: 6000 })
        }
      }
    },
    focusToggle: function () {
      var bounds = this.$refs.googlemap.$mapObject.getBounds().toJSON()
      var nsBuffer = Math.abs(bounds.north - bounds.south) / 4
      var ewBuffer = Math.abs(bounds.east - bounds.west) / 4

      var topLeft = { lat: bounds.north - nsBuffer, lng: bounds.west + ewBuffer }
      var topRight = { lat: bounds.north - nsBuffer, lng: bounds.east - ewBuffer }
      var bottomLeft = { lat: bounds.south + nsBuffer, lng: bounds.west + ewBuffer }
      var bottomRight = { lat: bounds.south + nsBuffer, lng: bounds.east - ewBuffer }

      this.setRegion([topLeft, topRight, bottomRight, bottomLeft])
    },
    viewBounds: function () {
      this.$refs.googlemap.fitBounds(this.viewBounds)
    }
  },
  methods: {
    ...mapActions([
      'addMarker',
      'deleteMarker',
      'initRegion',
      'setLoadingTiles',
      'setRegion'
    ]),
    clicked (args) {
      if (this.editing && window.google.maps.geometry.poly.containsLocation(args.latLng, new window.google.maps.Polygon({ paths: this.region }))) {
        this.addMarker({ lat: args.latLng.lat(), lng: args.latLng.lng() })
      } else if (this.editing) {
        this.$toasted.show('Please focus region before training a classification.', { duration: 4000 })
      }
    },
    updateOpacity () {
      this.$nextTick(function () {
        for (var i = 0; i < this.mapLayers.length; i++) {
          if (this.mapLayers[i] !== null && this.$refs.googlemap.$mapObject.overlayMapTypes.length >= 1) {
            this.$refs.googlemap.$mapObject.overlayMapTypes
              .getAt(i).setOpacity(this.mapLayers[i].visualized ? this.mapLayers[i].opacity / 100 : 0)
          }
        }
      })
    },
    getIcon (colour) {
      return {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: colour,
        fillOpacity: 0.6,
        strokeColor: 'white',
        strokeWeight: 0.5,
        scale: 4
      }
    },
    getOpacity () {
      return this.showMarkers ? 1 : 0
    },
    loaded () {
      this.setLoadingTiles(false)
    },
    updateEdited (mvcArray) {
      var path = []
      for (var j = 0; j < mvcArray.getAt(0).getLength(); j++) {
        var point = mvcArray.getAt(0).getAt(j)
        path.push({ lat: point.lat(), lng: point.lng() })
      }
      this.setRegion(path)
    }
  },
  created () {
    this.initRegion()
  }
}
</script>

<style>
@media only screen and (max-width: 992px) {
  .gmap {
    left: 0px;
    width: 100%;
  }
}

.adding div div div {
  cursor: crosshair;
}

.gmap {
  background-color: #eee;
  width: calc(100% - 300px);
  height: 100%;
  display: block;
  flex: 4 1 80%;
  left: 300px;
}
</style>
