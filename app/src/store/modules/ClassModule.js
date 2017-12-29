// Default colours
var colours = [
  '77AADD',
  'DDAA77',
  '77CCCC',
  'CC99BB',
  'DDDD77',
  'DD7788',
  '4477AA',
  'AA7744',
  '44AAAA',
  'AA4488',
  'AAAA44',
  'AA4455',
  '114477',
  '774411',
  '117777',
  '771155',
  '777711',
  '771122'
]

export default {
  state: {
    classes: [],
    editingClassIdx: 0,
    selectedClass: 0,
    selectedAssessment: 0
  },
  getters: {
    classes: state => state.classes,
    editingClass: state => state.editingClassIdx < state.classes.length ? state.classes[state.editingClassIdx] : state.editingClassIdx,
    selectedClass: state => state.classes[state.selectedClass],
    selectedIDX: state => state.selectedClass
  },
  actions: {
    addClass: ({ commit }, name) => commit('addClass', name),
    addMarker: ({ commit }, marker) => commit('addMarker', marker),
    deleteMarker: ({ commit }, indices) => commit('deleteMarker', indices),
    clearClasses: ({ commit }) => commit('clearClasses'),
    deleteClass: ({ commit }) => commit('deleteClass'),
    editClass: ({ commit }, editObj) => commit('editClass', editObj),
    selectClass: ({ commit }, index) => commit('selectClass', index),
    setClasses: ({ commit }, cls) => commit('setClasses', cls),
    setClassToEdit: ({ commit }, idx) => commit('setClassToEdit', idx),
    setAssessment: ({ commit }, idx) => commit('selectedAssessment', idx)
  },
  mutations: {
    addClass (state, name) {
      name = (typeof name === 'undefined' || name.length === 0) ? 'Class ' + (state.classes.length + 1) : name
      var colour = state.classes.length < colours.length ? '#' + colours[state.classes.length] : '#ff0000'
      var item = { name: name, colour: colour, markers: [] }
      state.classes.push(item)
      state.selectedClass = state.classes.length - 1
    },
    addMarker (state, marker) {
      state.classes[state.selectedClass].markers.push(marker)
    },
    deleteMarker (state, indices) {
      state.classes[indices.classIndex].markers.splice(indices.markerIndex, 1)
    },
    clearClasses (state) {
      state.classes = []
      state.selectedClass = 0
    },
    selectedAssessment (state, idx) {
      state.selectedAssessment = idx
    },
    deleteClass (state) {
      if (confirm("Are you sure you want to delete '" + state.classes[state.editingClassIdx].name + "'?")) {
        if (state.selectedClass === state.editingClassIdx && state.classes.length - 1 === state.editingClassIdx) {
          state.selectedClass = state.editingClassIdx - 1
        }
        state.classes.splice(state.editingClassIdx, 1)
      }
    },
    editClass (state, editObj) {
      state.classes[state.editingClassIdx].colour = editObj.colour
      state.classes[state.editingClassIdx].name = editObj.className
    },
    resetTraining (state) {
      if (confirm('Are you sure you want to clear all training data?')) {
        state.classes = []
        state.selectedIDX = 0
      }
    },
    selectClass (state, index) {
      state.selectedClass = index
    },
    setClasses (state, cls) {
      for (let cl of cls) {
        if (cl.markers.length > 0) {
          if (Array.isArray(cl.markers[0])) {
            cls.forEach(function (c, idx) {
              cls[idx].markers = cls[idx].markers.map(m => ({ lat: m[0], lng: m[1] }))
            })
          }
          break
        }
      }
      state.classes = cls
    },
    setClassToEdit (state, idx) {
      state.editingClassIdx = idx
    }
  }
}
