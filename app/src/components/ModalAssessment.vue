<template lang='pug'>
  modal(name='assessment-modal', width='760px', height='auto', :pivot-y='0.1', @before-open="beforeOpen")
    .inner
      h4 Assessment
      status(:status="status")
      md-layout(md-gutter="")
        md-layout(md-flex='33', md-align='center')
          h5 Total Area
        md-layout(md-flex='33', md-align='center')
          h5 AOO
        md-layout(md-flex='33', md-align='center')
          h5 EOO
      md-layout(md-gutter="")
        md-layout(md-flex='33', md-align='center')
          p The total area of your ecosystem in the classified map.
        md-layout(md-flex='33', md-align='center')
          p We overlay a grid with each grid at 10km by 10km and count the number of squares that the ecosystem of interest occurs in.
          p AOO 1% is the number of squares where the ecosystem has a total area of more than 1% of the grid (1km square).
            | See the <a href='/faq'>FAQ page</a> for more information.
        md-layout(md-flex='33', md-align='center')
          p 
            | The area of a minimal convex polygon containing your ecosystem. See the
            a(href='/faq')  FAQ page
            |  for more information.

      md-table(v-if="aoo !== 0")
        md-table-header
          md-table-row
            md-table-head Area ({{units}})
            md-table-head AOO
            md-table-head AOO 1%
            md-table-head Total Grids
            md-table-head(v-if="eoo !== 0") EOO ({{units}})
        md-table-body
          md-table-row
            md-table-cell {{area.toFixed(2)}}
            md-table-cell {{aoo}}
            md-table-cell {{aoo_1pc}}
            md-table-cell {{grids}}
            md-table-cell(v-if="eoo !== 0") {{eoo.toFixed(2)}}
</template>

<script>
import { mapGetters } from 'vuex'
import store from '../store'
import status from './Status'
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
      selected: {}
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
          vm.status = 'Error getting Area and AOO: ' + err.body.message
        })
    },
    getEoo () {
      var vm = this
      this.$http.post('/api/assessment/eoo', this.mapData())
        .then(data => {
          vm.eoo = data.body.eoo
          vm.status = ''
        }).catch(err => {
          console.log(err)
          vm.status = 'Error getting EOO: ' + err.body.message
        })
    },
    ...mapGetters(['mapData', 'classes'])
  }
}
</script>
