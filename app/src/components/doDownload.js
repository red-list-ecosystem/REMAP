export default (fileName, blob) => {
  var reader = new FileReader()
  reader.onload = function (e) {
    if (window.navigator.msSaveOrOpenBlob) {
      navigator.msSaveBlob(blob, fileName)
    } else {
      var downloadLink = document.createElement('a')
      downloadLink.href = window.URL.createObjectURL(blob)
      downloadLink.download = fileName
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
    }
  }
  reader.readAsDataURL(blob)
}
