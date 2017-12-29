<template lang='pug'>
  md-spinner(md-indeterminate, v-if='loaderActive')
</template>

<script>
  import store from '../store'
  import { mapGetters } from 'vuex'
  export default {
    name: 'loader',
    store,
    computed: mapGetters([ 'loaderActive' ])
  }
</script>

<style scoped>
  @media only screen and (max-width: 992px) {
    .md-spinner {
      left: 0;
    }
  }
  .md-spinner {
    left: calc(50% + 125px);
    top: 50%;
    position: absolute;
  }
</style>