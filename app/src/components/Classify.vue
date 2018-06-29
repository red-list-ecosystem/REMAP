<template lang='pug'>
    md-list-item(@click='check')
        md-icon play_arrow
        span Classify!
</template>

<script>
import store from '../store'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'classify',
  store,
  methods: {
    ...mapActions([
      'addMapLayer',
      'setLoadingTiles'
    ]),
    ...mapGetters([
      'mapData',
      'past'
    ]),
    check () {
      const lim = 20
      var tooFew = this.mapData().classList.filter(cl => cl.points.length < lim)
      if (tooFew.length !== 0) {
        this.$modal.show('dialog', {
          title: 'Too few markers',
          text: `${tooFew[0].name} has too few markers, currently (${tooFew[0].points.length}) we recommend at least ${lim} per class.`,
          buttons: [
            {
              title: 'Classify',
              handler: this.giveTraining
            },
            {
              title: 'Close'
            }
          ]
        })
      } else {
        this.giveTraining()
      }
    },
    giveTraining () {
      var md = this.mapData()
      this.setLoadingTiles(true)
      this.$http.post('/api/map', md).then(x => {
        var response = x.body.pop()
        this.setLoadingTiles(false)
        this.addMapLayer({
          type: 'classification',
          name: `Classification ${md.past ? '99-03' : '14-17'}`,
          label: '',
          mapid: response.mapid,
          token: response.token
        })
      }).catch(err => {
        this.setLoadingTiles(false)
        console.log(err)
        this.$toasted.show('Error getting classified map. ' + err.body.message, { duration: 5000 })
      })
    }
  }
}
</script>
<style scoped>
.md-button {
  width: 100%;
}

.md-icon {
  color: green !important;
}
</style>
