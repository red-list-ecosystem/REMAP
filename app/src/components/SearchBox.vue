<template lang="pug">
md-list-item.borderBottom
  md-input-container.md-input-focused
    gmap-autocomplete.md-input(@place_changed="placeChanged"
    placeholder="Search" 
    :selectFirstOnEnter="true")
    md-icon search
</template>

<script>
// https://github.com/xkjyeah/vue-google-maps/blob/vue2/examples/autocomplete.html
import { mapActions } from 'vuex'
import store from '../store'

export default {
  name: 'search-box',
  store,
  methods: {
    ...mapActions([ 'search' ]),
    placeChanged (place) {
      this.search(place)
    }
  }
}
</script>
