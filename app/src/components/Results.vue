<template lang='pug'>
	md-list-item(@click="resultsModal()")
		md-icon assessment
		span Results
</template>

<script>
export default {
  name: 'results',
  methods: {
    resultsModal: function () {
      this.$modal.show('resultsModal')
    }
  }
}
</script>
