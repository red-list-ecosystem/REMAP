<template lang="pug">
.status(v-if="status") 
  b Status:
  span  {{ status }}
</template>

<<script>
export default {
  name: 'status',
  props: ['status']
}
</script>

<style>
.status {
  text-align: center;
}
</style>
