<template lang='pug'>
  md-list-item
    md-icon show_chart
    span Assessment
    md-list-expand
      md-list-item
        md-input-container#classList
          label(for="classInterest") Class of interest:
          md-select(name="classInterest", v-model="assessSelect")
            md-option(v-for='(c, index) in classes', :key='index' :value="index") {{ c.name }}
      md-list-item
        md-button.md-accent.md-raised(@click='runAssessment') Run Assessment
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import store from '../store'

export default {
  name: 'assessment',
  data () {
    return {
      assessSelect: 0
    }
  },
  store,
  computed: mapGetters(['classes']),
  methods: {
    runAssessment () {
      this.setAssessment(this.assessSelect)
      this.$modal.show('assessment-modal', { selectedIndex: this.assessSelect })
    },
    ...mapActions(['setAssessment'])
  }
}
</script>

<style scoped>
#classList {
  margin-bottom: 0px;
}

.md-button {
  width: 100%;
}
</style>
