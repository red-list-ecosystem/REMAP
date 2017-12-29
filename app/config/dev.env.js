var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  client_id: '"705714878286-rke1llfkd24qjo425kc2htjq2sa2alk4.apps.googleusercontent.com"'
})
