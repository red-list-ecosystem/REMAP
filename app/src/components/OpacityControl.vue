<template lang="pug">
  div
    layer(v-for='(layerData, index) in mapLayers', v-if='layerData', :layerData='layerData', :layerIDX='index', :key='index')
</template>

<script>
import { mapGetters } from 'vuex'
import store from '../store'
import Layer from './Layer'

export default {
  name: 'opacity-control',
  store,
  components: { Layer },
  computed: mapGetters(['mapLayers'])
}
</script>
