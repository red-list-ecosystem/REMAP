# REMAP: Remote Ecosystem Mapping and Assessment Pipeline

### About
Remap (https://remap-app.org/) is an online mapping platform for people with little technical background in remote sensing. We developed remap to enable you to quickly map and report the status of ecosystems, contributing to a global effort to assess all ecosystems on Earth under the IUCN Red List of Ecosystems.

The general workflow of Remap is:
![alt tag](https://github.com/REMAPApp/REMAP/blob/master/static/images/WorkFlow-01.png)

### Setup / Install
Follow the instructions found on: [Earth engine apps](https://developers.google.com/earth-engine/app_engine_intro).
Additionally you will need an [Earth Engine service account](https://developers.google.com/earth-engine/service_account).
You will need to save your private key in a file called privatekey.pem and save it in the directory with app.yaml and server.py.

### Gulp
Run gulp to concat and minify the app.

```{js}
gulp
```
It will then monitor for changes in the `/static/js/app` folder and when these files change the changes will be minified and added to app.js, app-min.js in the `static/js/` folder

### Further information:
The [Remap app](https://remap-app.org/) was developed with funding from a Google Earth Engine Research Award. To find further information about the background, inner workings and methods of Remap please refer to our preprint manuscript on [bioRxiv](https://www.biorxiv.org/content/early/2017/11/01/212464).
[https://www.biorxiv.org/content/early/2017/11/01/212464](https://www.biorxiv.org/content/early/2017/11/01/212464)

Or email: n.murray@unsw.edu.au

### To cite REMAP:
Murray, N.J., Keith, D.A., Simpson, D., Wilshire, J.H. & Lucas, R.M. (2017) REMAP: An online remote sensing application for land cover classification and monitoring. bioRxiv. DOI: [10.1101/212464](https://www.biorxiv.org/content/early/2017/11/01/212464)

### Acknowledgements
Remap uses:
* Google Earth Engine
* Google App Engine
* JQuery
* Materialize (CSS)
And more
