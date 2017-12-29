<template lang='pug'>
  md-list-item
    md-icon toc
    span Select Predictors
    md-list-expand
      md-list-item(href='methods#predictors', target='_blank')
        | Which predictors to use?
      md-list-item
        md-input-container#predictorList
          label(for="predictorSelect") Choose predictors:
          md-select(name='predictorSelect' multiple v-model="selected")
            md-option(v-for="(p, index) in predictors", :value="p.short_name", :key="index") {{ p.short_name }}
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import store from '../store'

  export default {
    name: 'select-predictors',
    store,
    computed: mapGetters([ 'predictors' ]),
    methods: mapActions([ 'selectPredictors' ]),
    data () {
      return {
        selected: []
      }
    },
    watch: {
      selected () {
        this.selectPredictors(this.selected)
      },
      predictors () { // when we load predictors from our api we set the selected ones here.
        this.selected = this.predictors.filter(x => x.checked)
          .map(x => x.short_name)
      }
    }
  }
</script>

<style scoped>
  #predictorList {
    margin-bottom: 0px;
  }
</style>