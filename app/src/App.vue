<template lang="pug">
#app
  sidebar
  g-map
  md-button.md-primary.md-fab.md-fab-bottom-right(href='https://goo.gl/forms/etRt1SYclK6mz8993', target='_blank', title="Feedback")
    md-icon feedback
  //- #mobile-modal.modal
  //-   .modal-content
  //-     h4 Note:
  //-     p This application is best viewed on a larger screen.
  modal-class
  modal-upload
  modal-assessment
  modal-results
  loader
</template>

<script>
import Loader from './components/Loader'
import GMap from './components/GMap'
import ModalAssessment from './components/ModalAssessment'
import ModalClass from './components/ModalClass'
import ModalResults from './components/ModalResults'
import ModalUpload from './components/ModalUpload'
import Sidebar from './components/Sidebar'
import store from './store'
import { mapActions } from 'vuex'
export default {
  name: 'app',
  components: {
    GMap,
    Loader,
    ModalAssessment,
    ModalClass,
    ModalResults,
    ModalUpload,
    Sidebar
  },
  store,
  methods: mapActions(['setPredictors']),
  mounted () {
    this.$http.get('/api/config').then(data => {
      if (!data.body.debug) {
        window.onbeforeunload = function () {
          return true
        }
        this.$ga.page('/remap')
      } else {
        console.log('Running remap in debug mode.')
      }
      this.setPredictors(data.body.predictors)
    })
  }
}
</script>

<style>
#app {
  height: 100%;
  position: fixed;
  width: 100%;
}

.borderBottom {
  border-bottom: 1px solid #e0e0e0;
}

.borderTop {
  border-top: 1px solid #e0e0e0;
}

.container {
  padding-left: 300px;
}

.hidden {
  display: none;
}

.noselect {
  -webkit-touch-callout: none;
  /* iOS Safari */
  -webkit-user-select: none;
  /* Safari */
  -khtml-user-select: none;
  /* Konqueror HTML */
  -moz-user-select: none;
  /* Firefox */
  -ms-user-select: none;
  /* Internet Explorer/Edge */
  user-select: none;
  /* Non-prefixed version, currently supported by Chrome and Opera */
}
</style>
