<template lang='pug'>
  modal(name='resultsModal', width='760px', height='auto', :pivot-y='0.1', @before-open="beforeOpen")
    .inner
      h4 Results
      status(:status="status")
      md-layout
        .chart-container(v-if="rows")
          vue-chart( chart-type="ColumnChart" :columns="columns", :rows="rows" :options="options")
        .area-download(v-if='downloadReady')
          a.md-button(@click='areaCSV') Download Area CSV
      md-layout(v-if='accuracy')
        md-layout
          p.md-body-1 Error rate: 
            strong {{ String(100 * (1 - accuracy.accuracy)) | truncate(6, '%') }}
        md-layout
          p.md-body-1 The error rate is obtained by calculating the percentage of training points that were incorrectly classified by the model that was trained with all of the training data.

</template>
<script>
import { mapGetters } from 'vuex'
import store from '@/store'
import status from './Status'
import doDownload from './../doDownload'
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
      status: 'Getting Area barchart...',
      downloadReady: false,
      accuracy: false
    }
  },
  methods: {
    ...mapGetters(['mapData', 'json', 'classes']),
    getPerformance () {
      this.$http.post('/api/performance', this.mapData())
        .then(data => {
          this.accuracy = data.body
          this.status = false
        })
        .catch(err => {
          console.log(err)
          if (err.body.message.match('^Deadline')) {
            this.status = 'Deadline Exceeded, trying again'
            this.getPerformance()
          } else {
            this.status = 'Error getting results: ' + err.body.message
          }
        })
    },
    beforeOpen () {
      this.rows = false
      this.accuracy = false
      this.downloadReady = false
      this.status = 'Getting Area barchart...'
      this.getHistData()
    },
    areaCSV () {
      var output = ['class_name,area_km2'].concat(
        this.rows.map(row => `${row[0]}, ${row[1]}`))
      var blob = new Blob([output.join('\n') + '\n'], { type: 'text/csv' })
      doDownload('remap_area.csv', blob)
    },
    getHistData () {
      var fix = x => x / 1e6
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
          this.downloadReady = true
        })
        .catch(err => {
          console.log(err)
          if (err.body.message.match('^Deadline')) {
            this.status = 'Deadline Exceeded, trying again'
            this.getHistData()
          } else {
            this.status = 'Error getting area column chart: ' + err.body.message
          }
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
.area-download {
  margin: 0 auto;
}
</style>
