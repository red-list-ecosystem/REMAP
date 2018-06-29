<template lang='pug'>
  modal(name='helpModal', width='300px', height='auto', :pivot-y='0.1')
    .inner
      h4 Help
      br
      p Help using remap can be found at these links:
      p
        a(href='https://remap-app.org/faq' target="_blank") Frequently Asked Questions
      p
        a(href='https://remap-app.org/tutorials' target="_blank") User Guide and Tutorials
      p
        a(href='https://goo.gl/forms/etRt1SYclK6mz8993', target='_blank', title="Feedback") Feedback
      
</template>
<script>
export default {}
</script>

<style>

</style>
