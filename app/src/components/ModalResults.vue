<template lang='pug'>
  modal(name='resultsModal', width='760px', height='auto', :pivot-y='0.1', @before-open="beforeOpen")
    .inner
      h4 Results
      md-layout
      .chart-container(v-if="rows")
        vue-chart( chart-type="ColumnChart" :columns="columns", :rows="rows" :options="options")
      p(v-if="accuracy").accuracy Resubstitution accuracy: 
        span {{ String(accuracy.accuracy* 100) | truncate(6, '%') }}
      br
      status(:status="status")
</template>
<script>
import { mapGetters } from 'vuex'
// import AreaChart from './AreaChart'
import store from '../store'
import status from './Status'
export default {
  name: 'modal-results',
  store,
  components: { status },
  data () {
    return {
      rows: false,
      columns: [{
        type: 'string',
        label: 'Class'
      }, {
        type: 'number',
        label: 'Area'
      }, {
        type: 'string',
        role: 'style'
      }],
      options: {
        title: 'Area in KM^2 (Estimate)',
        legend: { position: 'none' }
      },
      status: 'Getting Area Histogram...',
      accuracy: false
    }
  },
  // components: { AreaChart },
  methods: {
    ...mapGetters(['mapData', 'json', 'classes']),
    getPerformance () {
      this.$http.post('/api/performance', this.mapData())
        .then(data => {
          this.accuracy = data.body
          this.status = false
        })
        .catch(err => {
          this.status = 'Error getting results: ' + err.body.message
        })
    },
    beforeOpen () {
      this.status = 'Getting Area Histogram...'
      this.getHistData()
    },
    getHistData () {
      var fix = x => Number.parseFloat((x / 1e6).toFixed())
      this.$http.post('/api/areadata', this.mapData())
        .then(data => {
          this.rows = this.classes().map((x, i) => {
            return [
              x.name,
              fix(data.body.groups[i].classification),
              'color: ' + x.colour
            ]
          })
          this.status = 'Getting Accuracy Information.'
          this.getPerformance()
        })
        .catch(err => {
          console.log(err)
          this.status = 'Error getting area column chart: ' + err.body.message
        })
    }
  }
}
</script>

<style>
.chart-container,
.accuracy,
.status {
  width: 80%;
  margin: 0 auto;
}
</style>
