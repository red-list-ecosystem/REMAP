export default {
  state: {
    mapLayers: [],
    region: [],
    showMarkers: true,
    focusToggle: false,
    viewBounds: null,
    viewCentre: {},
    viewZoom: 9
  },
  getters: {
    mapLayers: state => state.mapLayers,
    region: state => state.region,
    showMarkers: state => state.showMarkers,
    focusToggle: state => state.focusToggle,
    viewBounds: state => state.viewBounds,
    viewCentre: state => state.viewCentre,
    viewZoom: state => state.viewZoom
  },
  actions: {
    addMapLayer: ({ commit }, layer) => commit('addMapLayer', layer),
    deleteMapLayer: ({ commit }, layerIDX) => commit('deleteMapLayer', layerIDX),
    initRegion: ({ commit }) => commit('initRegion'),
    setBounds: ({ commit }, bounds) => commit('setBounds', bounds),
    setRegion: ({ commit }, rgn) => commit('setRegion', rgn),
    setRegionFocus: ({ commit }, rgn) => commit('setRegionFocus', rgn),
    setShowMarkers: ({ commit }, val) => commit('setShowMarkers', val),
    toggleFocus: ({ commit }) => commit('toggleFocus'),
    search: ({ commit }, body) => commit('search', body)
  },
  mutations: {
    addMapLayer (state, layer) {
      if (layer.type === 'predictor') {
        layer.opacity = 100
        layer.visualized = true
        state.mapLayers.splice(0, 1, layer)
      } else {
        layer.opacity = 100
        layer.visualized = true
        if (state.mapLayers.length === 3) {
          state.mapLayers.splice(1, 1) // remove the second last classification
        }
        state.mapLayers.push(layer)
      }
    },
    deleteMapLayer (state, layerIDX) {
      if (layerIDX !== 0 && layerIDX < state.mapLayers.length) {
        state.mapLayers.splice(layerIDX, 1)
      }
    },
    initRegion (state) {
      state.region = [
        { lat: -35.52359131926069, lng: 136.38815795898438 },
        { lat: -35.52359131926069, lng: 138.25308715820312 },
        { lat: -36.214641115198745, lng: 138.25308715820312 },
        { lat: -36.214641115198745, lng: 136.38815795898438 }
      ]
      state.viewCentre = { lat: -35.8691162172, lng: 137.320622559 }
      state.viewZoom = 9
      if ('google' in window) {
        state.viewBounds = new window.google.maps.LatLngBounds()
        state.region.forEach(pos => state.viewBounds.extend(new window.google.maps.LatLng(pos)))
      }
    },
    setBounds (state, bounds) {
      state.viewBounds = bounds
    },
    setRegion (state, rgn) {
      if (rgn[0] instanceof Array) {
        rgn = rgn.map(m => ({ lat: m[0], lng: m[1] }))
      }
      state.region = rgn
    },
    setRegionFocus (state, rgn) {
      var bounds = new window.google.maps.LatLngBounds()
      if (rgn[0] instanceof Array) {
        rgn = rgn.map(m => ({ lat: m[0], lng: m[1] }))
      }
      state.region = rgn
      rgn.forEach(m => bounds.extend(new window.google.maps.LatLng(m.lat, m.lng)))
      state.viewBounds = bounds
    },
    setShowMarkers (state, val) {
      state.showMarkers = val
    },
    toggleFocus (state) {
      state.focusToggle = !state.focusToggle
    },
    search (state, body) {
      state.viewBounds = body.geometry.viewport
    }
  }
}
