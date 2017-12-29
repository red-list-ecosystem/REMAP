export default {
  state: {
    googleObject: null,
    serverSignedIn: false
  },
  getters: {
    emailAddress: (state, getters) => getters.isSignedIn ? state.googleObject.currentUser.get().getBasicProfile().getEmail() : 'Not signed in.',
    isSignedIn: state => state.googleObject !== null && state.googleObject.isSignedIn.get() && state.serverSignedIn
  },
  actions: {
    setGoogleObject: ({ commit }, gObj) => commit('setGoogleObject', gObj),
    signIn: ({ commit }) => commit('signIn'),
    signOut: ({ commit }) => commit('signOut')
  },
  mutations: {
    setGoogleObject (state, gObj) {
      state.googleObject = gObj
    },
    signIn (state) {
      state.serverSignedIn = true
    },
    signOut (state) {
      state.googleObject.signOut().then(_ => console.log('signed out'))
      state.serverSignedIn = false
    }
  }
}
