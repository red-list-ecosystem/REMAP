<template lang="pug">
  md-list-item.borderBottom
    md-icon layers
    span
      b Map Control
    md-list-expand#controlList
      md-list-item
        md-switch.md-primary(v-model="markerVisibility") Markers Visible
      md-list-item
        md-input-container
          label(for="predictorVis") Predictor:
          md-select(name="predictorVis", v-model="predVis", @change="getPredictorLayer(true)")
            md-option(value='natural') Natural
            md-option(v-for='(predictor, index) in predictorVis', :value='predictor.short_name', :key='index') {{ predictor.short_name }}
      md-list-item(v-if="sigmaDisplayed")
        md-input-container
          label(for="sigmaVis") Sigma:
          md-select(name="sigmaVis", v-model="sigma" @change="getPredictorLayer(false)")
            md-option(value='1') 1
            md-option(value='1.5') 1.5
            md-option(value='2', selected="true") 2
            md-option(value='2.5') 2.5
            md-option(value='3') 3
</template>

<script>
import store from '../store'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'map-control',
  store,
  computed: {
    ...mapGetters(['predictorVis', 'region', 'past', 'showMarkers']),
    sigmaDisplayed: function () {
      return ['natural', 'past-natural'].indexOf(this.predVis) === -1
    }
  },
  data () {
    return {
      markerVisibility: true,
      predVis: 'natural',
      mean: 0,
      total_sd: 0,
      sigma: '2',
      // to stop the getPredictorlayer method firing twice on load
      last: ''
    }
  },
  watch: {
    markerVisibility () {
      this.setShowMarkers(this.markerVisibility)
    },
    showMarkers () {
      // if showMarkers has been changed by enabling adding markers, we
      // make the switch reflect this change
      if (this.showMarkers !== this.markerVisibility) this.markerVisibility = this.showMarkers
    },
    past () {
      this.getPredictorLayer(true)
    }
  },
  methods: {
    ...mapActions([
      'addMapLayer',
      'setLoadingTiles',
      'setShowMarkers'
    ]),
    getPredictorLayer (reset) {
      var check = `${this.predVis}, ${this.sigma}, ${this.past}`
      if (this.last === check) {
        return
      }
      this.last = check
      var vm = this
      var visData = {
        predictor: this.predVis,
        sigma: parseFloat(this.sigma),
        region: this.region,
        past: this.past
      }
      if (!reset) {
        visData.mean = this.mean
        visData.total_sd = this.total_sd
      }
      this.setLoadingTiles(true)
      this.$http.post('/api/predictorlayer', visData).then(x => {
        vm.total_sd = x.body.total_sd
        vm.mean = x.body.mean
        vm.addMapLayer({
          type: 'predictor',
          name: 'Predictor ' + (vm.past ? '99-03' : '14-17') + ': ',
          label: x.body.label,
          mapid: x.body.mapid,
          token: x.body.token
        })
      }).catch(err => {
        console.log(err)
        vm.$toasted.show('Error getting predictor layer.', { duration: 5000 })
      })
    }
  }
}
</script>

<style>
#controlList .md-list-item .md-list-item-container .md-input-container {
  margin-bottom: 0px;
}

#controlList .md-switch {
  left: 20%;
}

.md-select-content {
  max-height: 100%;
}
</style>
