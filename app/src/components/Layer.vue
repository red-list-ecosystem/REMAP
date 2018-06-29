<template lang='pug'>
  .layer.borderBottom
    md-button.md-icon-button(@click='deleteLayer', v-if='!isPredictorLayer')
      md-icon delete
    md-input-container(md-inline)
      md-input(:disabled='isPredictorLayer', v-model='layerName', ref='layerName')
    md-list-item.short
      md-checkbox.md-primary(v-model="layerData.visualized")
      vue-slider(name="slider",
      v-model='layerData.opacity' , v-bind='slider', tooltip='hover', width='100%')
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import store from '../store'
import vueSlider from 'vue-slider-component'

export default {
  name: 'layer',
  props: ['layerData', 'layerIDX'],
  components: {
    vueSlider
  },
  store,
  computed: mapGetters(['mapLayers']),
  data () {
    return {
      isPredictorLayer: this.layerData.name.startsWith('Predictor'),
      layerName: this.layerData.name + this.layerData.label,
      slider: {
        height: 3,
        min: 0,
        max: 100,
        processStyle: {
          backgroundColor: '#c62828'
        },
        sliderStyle: {
          backgroundColor: '#c62828',
          boxShadow: 'none'
        },
        tooltipStyle: {
          backgroundColor: '#c62828',
          border: '1px solid #c62828'
        }
      }
    }
  },
  methods: {
    ...mapActions([ 'deleteMapLayer' ]),
    deleteLayer: function () {
      this.deleteMapLayer(this.layerIDX)
    }
  }
}
</script>

<style scoped>
.layer {
  max-height: 64px;
}

.md-button.md-icon-button {
  height: 24px;
  min-width: 24px;
  position: fixed;
  right: 6px;
  width: 24px;
}

.md-checkbox {
  margin: 0 8px 0 0;
}

.md-icon {
  float: right;
  color: #aaa;
}

.md-input-container {
  margin: 0 auto 10px auto;
  min-height: 0px;
  padding: 0px;
  top: 10px;
  width: 75%;
}

.md-input-container.md-input-disabled input {
  color: rgba(0, 0, 0, 1.0)
}

.md-input-container input {
  font-size: 14px !important;
  font-weight: bold;
  height: 20px;
  text-align: center;
}

.md-input-container:not(.md-input-focused)::after {
  display: none;
}

.md-list-item {
  margin-bottom: 5px;
}
</style>

<style>
.md-list-item.short .md-list-item-container {
  min-height: 20px;
}
</style>
