<template lang='pug'>
    md-list-item(@click='giveTraining')
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
    giveTraining () {
      var md = this.mapData()
      this.setLoadingTiles(true)
      this.$http.post('/api/map', md).then(x => {
        var response = x.body.pop()
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
