<template lang='pug'>
  modal(name='assessment-modal', width='760px', height='auto', :pivot-y='0.1', @before-open="beforeOpen")
    .inner
      h4 Assessment
      status(:status="status")
      md-layout(md-gutter="")
        //md-layout( md-align='center')
          h5 Total Area
        md-layout(md-align='center')
          h5 AOO
        md-layout( md-align='center')
          h5 EOO
      md-layout(md-gutter="")
        md-layout( md-align='center')
          p We overlay the classification with a grid at a spatial resolution of 10km by 10km and count the number of squares that the ecosystem of interest occurs in.
          p AOO 1% is the number of squares where the ecosystem has a total area of more than 1% of the grid (1km square).
            | See the <a href='/faq'>FAQ page</a> for more information.
          p This assessment is performed with the current training data on the map.
        md-layout( md-align='center')
          p
            | The area of a minimal convex polygon containing your ecosystem. See the
            a(href='/faq')  FAQ page
            |  for more information.

      md-table(v-if="aoo !== 0")
        md-table-header
          md-table-row
            md-table-head Class Name
            // md-table-head Area ({{units}})
            md-table-head AOO
            md-table-head AOO 1%
            md-table-head Total Grids
            md-table-head(v-if="eoo !== 0") EOO ({{units}})
        md-table-body
          md-table-row
            md-table-cell {{selected.name}}
            // md-table-cell {{area.toFixed(2)}}
            md-table-cell {{aoo}}
            md-table-cell {{aoo_1pc}}
            md-table-cell {{grids}}
            md-table-cell(v-if="eoo !== 0") {{eoo.toFixed(2)}}
      .download-button(v-if='downloadReady')
        a.md-button(@click='downloadCSV') Download as CSV
</template>

<script>
import { mapGetters } from 'vuex'
import store from '@/store'
import status from './Status'
import doDownload from './../doDownload'

export default {
  name: 'modal-assessment',
  store,
  components: { status },
  data () {
    return {
      aoo: 0,
      eoo: 0,
      area: 0,
      grids: 0,
      units: '',
      aoo_1pc: 0,

      status: '',
      selected: {},
      downloadReady: false
    }
  },
  methods: {
    beforeOpen (selected) {
      this.selected = this.classes()[selected.params.selectedIndex]
      this.status = 'Calculating Area and AOO statistics for ' + this.selected.name
      // reset the metrics
      this.area = 0
      this.aoo = 0
      this.aoo_1pc = 0
      this.grids = 0
      this.eoo = 0
      this.downloadReady = false
      this.getAoo()
    },
    getAoo () {
      var vm = this
      this.$http.post('/api/assessment/aoo', this.mapData())
        .then(data => {
          this.status = 'Calculating EOO'
          this.area = data.body.area
          this.grids = data.body.grids
          this.units = data.body.units
          this.aoo = data.body.aoo
          this.aoo_1pc = data.body.aoo_1pc
          this.getEoo()
        }).catch(err => {
          console.log(err)
          if (err.body.message.match(/^Deadline/)) {
            this.getAoo()
          } else {
            vm.status = 'Error getting Area and AOO: ' + err.body.message
          }
        })
    },
    getEoo () {
      var vm = this
      this.$http.post('/api/assessment/eoo', this.mapData())
        .then(data => {
          vm.eoo = data.body.eoo
          vm.status = ''
          this.downloadReady = true
        }).catch(err => {
          console.log(err)
          if (this.err.body.message.match(/^Deadline/)) {
            this.getEoo()
          } else {
            vm.status = 'Error getting EOO: ' + err.body.message
          }
        })
    },
    downloadCSV () {
      var headings = [
        'class_name',
        // 'area',
        'aoo',
        'aoo_1pc',
        'grids',
        'grid_size',
        'eoo',
        'units'
      ].join(',')
      var data = [
        this.selected.name,
        // this.area,
        this.aoo,
        this.aoo_1pc,
        this.grids,
        '10km x 10km',
        this.eoo,
        this.units
      ].join(',')
      var output = [headings].concat([data])
      var blob = new Blob([output.join('\n') + '\n'], { type: 'text/csv' })
      doDownload(`remap_assessment_${this.selected.name}.csv`, blob)
    },
    ...mapGetters(['mapData', 'classes'])
  }
}
</script>
<style>
.download-button {
  text-align: center;
}
</style>
