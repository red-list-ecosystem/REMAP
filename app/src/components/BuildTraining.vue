<template lang='pug'>
  md-list-item
    md-icon room
    span Build Training Set
    md-list-expand
      md-list-item(@click='uploadModal')
        md-icon file_upload
        span Upload Data
      md-list-item.noselect.md-disabled#orContainer
        span.text-divider Or
      md-list-item.borderBottom(v-bind:class='{ active: editing }', @click='toggleEditing')
        md-icon add_location
        span Add Markers
      md-list-item.classVal(v-for='(c, index) in classes',
        v-bind:class='{ active: index == selectedIDX }',
        @click='selectClass(index)',
        :key='index')
        .legend-colour(:style='{ background: c.colour }')
        span.className {{ c.name }}
        span.classNum {{ c.markers.length }} pts
        a(@click='editClass(index)')
          md-icon settings
      md-list-item.borderTop.borderBottom(@click='addClass("")')
        md-icon add
        span Add New Class
      md-list-item(@click='resetTraining')
        md-icon delete
        span Reset Training Data
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'
  import store from '../store'

  export default {
    name: 'build-training',
    store,
    computed: mapGetters([ 'classes', 'editing', 'selectedIDX' ]),
    mounted () {
      if (this.classes.length === 0) {
        this.addClass()
      }
    },
    watch: {
      classes: function () {
        if (this.classes.length === 0) {
          this.addClass()
        }
      }
    },
    methods: {
      ...mapActions([
        'addClass',
        'addMarkers',
        'resetTraining',
        'selectClass',
        'setClassToEdit',
        'toggleEditing'
      ]),
      editClass (idx) {
        this.setClassToEdit(idx)
        this.$modal.show('classModal')
      },
      uploadModal () {
        this.$modal.show('uploadModal')
      }
    }
  }
</script>

<style>
  #orContainer .md-list-item-container {
    min-height: 0px;
    margin: 1px 0px;
  }
  .active {
    background: #CC1417;
    color: white;
  }
  .active .md-list-item-container {
    background-color: transparent !important;
  }
  .className {
    margin-right: auto;
  }
  .classNum {
    background: #333333;
    border-radius: 3px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    height: 22px;
    line-height: 22px;
    margin-right: 6px;
    padding: 0px 7px;
  }
  .classVal.md-list-item .md-list-item-container {
    min-height: 0;
  }
  .classVal a {
    z-index: 2;
  }
  .legend-colour {
    float: left;
    width: 27px;
    height: 27px;
    border: 1px solid rgba(0, 0, 0, .2);
    margin: 4px 7px 4px 0px;
  }
  .text-divider {
    display: flex;
    flex-basis: 100%;
    align-items: center;
    color: rgba(0, 0, 0, 0.75);
    margin: 1px 0;
    padding: 2px;
    font-weight: 500;
    line-height: 1em !important;
  }
  .text-divider:before, 
  .text-divider:after {
      content: "";
      flex-grow: 1;
      background: rgba(0, 0, 0, 0.35);
      height: 2px;
      font-size: 0px;
      line-height: 0px;
      margin: 0 10px;
  }
</style>