// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import * as VueGoogleMaps from 'vue2-google-maps'
import VModal from 'vue-js-modal'
import Toasted from 'vue-toasted'
import VueCharts from 'vue-charts'
import VueResource from 'vue-resource'
import VueAnalytics from 'vue-analytics'

Vue.config.productionTip = false

var VueTruncate = require('vue-truncate-filter')

Vue.use(VueResource)
Vue.use(VueMaterial)
Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyAyyUOUNBCZo_u4YpTl6ioNMWbWMy2rx7w',
    libraries: 'places'
  }
})
Vue.use(VModal, { dialog: true })
Vue.use(Toasted)
Vue.use(VueCharts)
Vue.use(VueTruncate)
Vue.use(VueAnalytics, {
  id: 'UA-98429542-1'
})

Vue.material.registerTheme('default', {
  primary: {
    color: 'red',
    hue: 800
  },
  accent: {
    color: 'grey',
    hue: 900
  }
})
/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
  http: {
    root: '/api'
  }
})
