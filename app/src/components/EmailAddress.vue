<template lang='pug'>
  md-list-item.md-disabled.noselect
    span {{ emailAddress }}
</template>

<script>
  import { mapGetters } from 'vuex'
  import store from '../store'
  export default {
    name: 'email-address',
    store,
    computed: mapGetters([ 'emailAddress' ])
  }
</script>

<style scoped>
  .md-disabled {
    color: rgba(0, 0, 0, 0.54);
  }
</style>