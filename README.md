# REMAP: Remote Ecosystem Mapping and Assessment Pipeline
Otherwise known as gee-pipe-app

## Setup / Install
Follow the instructions found on: [Earth engine apps](https://developers.google.com/earth-engine/app_engine_intro).
Additionally you will need an [Earth Engine service account](https://developers.google.com/earth-engine/service_account).
You will need to save your private key in a file called privatekey.pem and save it in the directory with app.yaml and server.py.

### Gulp
Run gulp to concat and minify the app.

```{js}
gulp
```
It will then monitor for changes in the `/static/js/app` folder and when these files change the changes will be minified and added to app.js, app-min.js in the `static/js/` folder

## Acknowledgements
Remap uses:
* Google Earth Engine
* Google App Engine
* JQuery
* Materialize (CSS)
And more