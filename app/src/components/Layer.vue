<template lang='pug'>
  .layer.borderBottom
    .my-label(for='slider' + layerIDX) {{ layerData.name + layerData.label | truncate(40)}}
    md-list-item
      md-checkbox.md-primary(v-model="layerData.visualized")
      vue-slider(name="slider",
      v-model='layerData.opacity' , v-bind='slider', tooltip='hover', width='100%')
</template>

<script>
import vueSlider from 'vue-slider-component'

export default {
  name: 'layer',
  props: ['layerData', 'layerIDX'],
  components: {
    vueSlider
  },
  data () {
    return {
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
  }
}
</script>

<style scoped>
.my-label {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  line-height: 20px;
  height: 0;
  width: 100%;
  display: inline-block;
  position: relative;
  top: 15px;
  justify-content: space-between;
}

.layer {
  max-height: 64px;
}

.md-icon {
  float: right;
  color: #aaa;
}
</style>
