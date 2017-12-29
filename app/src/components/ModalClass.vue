<template lang='pug'>
  // TODO accept return to save
  modal(name='classModal', width='300px', height='auto', :pivot-y='0.1')
    md-input-container
      label Class Name
      md-input(v-model='className')
    md-layout(md-align='center')
      sketch(v-model="colour")
    .button-group
      a(@click='save') OK
      a(@click='close') Cancel
      a(@click='deleteClassClick') Delete
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import store from '../store'
import { Sketch } from 'vue-color'

export default {
  name: 'modal-class',
  store,
  components: {
    Sketch
  },
  computed: mapGetters([
    'editingClass'
  ]),
  data () {
    return {
      className: '',
      colour: '#77AADD'
    }
  },
  watch: {
    editingClass (selected) {
      this.colour = selected.colour
      this.className = selected.name
    }
  },
  methods: {
    ...mapActions([
      'deleteClass',
      'editClass'
    ]),
    save: function () {
      this.editClass({
        'colour': this.colour.hex || this.colour,
        'className': this.className
      })
      this.$modal.hide('classModal')
    },
    close: function () {
      this.$modal.hide('classModal')
    },
    deleteClassClick: function () {
      this.deleteClass(this.editingClass)
      this.$modal.hide('classModal')
    }
  }
}
</script>

<style scoped>
.button-group {
  display: flex;
  flex: 0 1 auto;
  width: 100%;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

.button-group a {
  flex: 1 1 33.3333%;
  height: 44px;
  line-height: 44px;
  cursor: pointer;
  text-align: center;
  color: inherit;
  text-decoration: none !important;
}

.button-group a:hover {
  background: rgba(0, 0, 0, 0.1);
}

.button-group a:not(:first-of-type) {
  border-left: 1px solid #eee;
}

.md-input-container {
  left: 10%;
  width: 80%;
}

.vc-sketch {
  box-shadow: none;
}
</style>
