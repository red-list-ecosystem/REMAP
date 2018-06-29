import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import AuthModule from './modules/AuthModule.js'
import ClassModule from './modules/ClassModule.js'
import MapModule from './modules/MapModule.js'

export default new Vuex.Store({
  modules: {
    auth: AuthModule,
    class: ClassModule,
    map: MapModule
  },
  state: {
    classifying: false,
    editing: false,
    loadingTiles: true,
    past: false,
    predictors: [],
    selectedPredictors: [],
    maxRegionSize: 100000,
    citation: ''
  },
  getters: {
    editing: state => state.editing,
    json: state => JSON.stringify({
      classes: state.class.classes,
      region: state.map.region
    }),
    mapData: state => {
      return {
        region: state.map.region,
        classList: state.class.classes.map((x, i) => {
          return {
            points: x.markers,
            colour: x.colour,
            lab: i + 1,
            name: x.name
          }
        }),
        selected: state.class.selectedAssessment,
        past: state.past,
        predictors: state.selectedPredictors
      }
    },
    loaderActive: state => state.classifying || state.loadingTiles,
    // predictor gets
    predictorVis: state => state.predictors.filter(x => x.vis),
    predictors: state => state.predictors,
    citation: state => state.citation,
    maxRegionSize: state => state.maxRegionSize,
    past: state => state.past
  },
  actions: {
    resetTraining: ({ commit }) => commit('resetTraining'),
    toggleEditing: ({ commit }) => commit('toggleEditing'),
    setClassifying: ({ commit }, val) => commit('setClassifying', val),
    setLoadingTiles: ({ commit }, val) => commit('setLoadingTiles', val),
    setPast: ({ commit }, val) => commit('setPast', val),
    setPredictors: ({ commit }, predictors) => commit('setPredictors', predictors),
    setCitation: ({ commit }, citation) => commit('setCitation', citation),
    selectPredictors: ({ commit }, selected) => commit('selectPredictors', selected),
    setMaxRegionSize: ({ commit }, size) => commit('setMaxRegionSize', size)
  },
  mutations: {
    setPast (state, past) {
      state.past = past
    },
    setMaxRegionSize (state, size) {
      state.setMaxRegionSize = size
    },
    setClassifying (state, val) {
      state.classifying = val
    },
    setLoadingTiles (state, val) {
      state.loadingTiles = val
    },
    toggleEditing (state) {
      if (!state.editing && !state.map.showMarkers) state.map.showMarkers = true
      state.editing = !state.editing
    },
    // Predictors
    setPredictors (state, predictors) {
      state.predictors = predictors
    },
    setCitation (state, citation) {
      state.citation = citation
    },
    selectPredictors (state, predictors) {
      state.selectedPredictors = predictors
    }
  }
})
