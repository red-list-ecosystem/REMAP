<template lang='pug'>
  md-list-item(@click='toggleFocus')
    md-icon games
    span Focus Region
</template>

<script>
  import { mapActions } from 'vuex'
  import store from '../store'

  export default {
    name: 'focus-region',
    store,
    methods: mapActions([ 'toggleFocus' ])
  }
</script>