<template lang='pug'>
  md-sidenav.md-left.md-fixed
    a.logo-link(href='/')
      img(src='../assets/LogoRedSponsors_v1_small-01.png')
    md-list
      search-box
      opacity-control
      past-switch
      map-control
      focus-region
      build-training
      select-predictors
      classify
      results
      assessment
      export
      email-address(v-if="emailAddress")
      md-list-item
        md-icon info
        span.md-body-1
          a.clickable(@click='helpModal') Help
          | , 
          a(href="/about", target="_blank") About
          | , 
          a(href="/methods"  target="_blank") Methods 
          | and 
          a.clickable(@click='openCitation') Citation
</template>

<script>
import Assessment from './Assessment'
import BuildTraining from './BuildTraining'
import Classify from './Classify'
import EmailAddress from './EmailAddress'
import Export from './Export'
import FocusRegion from './FocusRegion'
import MapControl from './MapControl'
import OpacityControl from './OpacityControl'
import Results from './Results'
import SearchBox from './SearchBox'
import SelectPredictors from './SelectPredictors'
import PastSwitch from './PastSwitch'
import store from '@/store'
import { mapGetters } from 'vuex'

export default {
  name: 'sidebar',
  store,
  computed: mapGetters(['emailAddress', 'citation']),
  components: {
    Assessment,
    BuildTraining,
    Classify,
    EmailAddress,
    Export,
    PastSwitch,
    FocusRegion,
    MapControl,
    OpacityControl,
    Results,
    SearchBox,
    SelectPredictors
  },
  methods: {
    helpModal: function () {
      this.$modal.show('helpModal')
    },
    openCitation () {
      this.$modal.show('dialog', {
        text: this.citation,
        buttons: [
          {
            title: 'Close'
          }
        ]
      })
    }
  }
}
</script>

<style>
img {
  width: 300px;
}

#searchItem .md-list-item-container {
  padding: 0 !important;
  min-height: 0px !important;
}

.clickable {
	cursor: pointer;
	-webkit-user-select: none;  /* Chrome all / Safari all */
  -moz-user-select: none;     /* Firefox all */
  -ms-user-select: none;      /* IE 10+ */
  user-select: none;          /* Likely future */
}

.md-sidenav-content {
  width: 300px !important;
  pointer-events: auto !important;
  transform: translateZ(0) !important;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12),
    0 3px 1px -2px rgba(0, 0, 0, 0.2);
}

.md-sidenav-content .md-list {
  padding-top: 0px;
}

.md-active > div > span {
  color: #c62828;
}
</style>
