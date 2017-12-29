<template lang="pug">
md-list-item.borderBottom
  md-icon date_range
  div
    label.md-switch-label-left Past
    md-switch(v-model="present").md-primary Present
</template>

<script>
import store from '../store'
import { mapActions } from 'vuex'
export default {
  name: 'past-switch',
  store,
  data () {
    return {
      present: true
    }
  },
  watch: {
    present () {
      this.setPast(!this.present)
    }
  },
  methods: mapActions(['setPast'])
}
</script>

<style>
.md-switch-label-left {
  height: 14px;
  padding-right: 8px;
  line-height: 14px;
}
</style>

