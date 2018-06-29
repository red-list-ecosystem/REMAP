# [REMAP](https://remap-app.org): Remote Ecosystem Monitoring and Assessment Pipeline
Remap is an online mapping platform for people with little technical background in remote sensing. We developed remap to enable you to quickly map and report the status of ecosystems, contributing to a global effort to assess all ecosystems on Earth under the [IUCN Red List of Ecosystems](https://iucnrle.org).

The general workflow of Remap is:
![alt tag](https://github.com/REMAPApp/REMAP/blob/master/static/images/WorkFlow-01.png)

# Development

Development of Remap is split into two halves:

## 1. The Python backend

Located in the  `/backend` directory, this is a Python2.7 webapp2  running on [Google App Engine](https://cloud.google.com/appengine/docs/). It provides the front facing app (in the `/app` directory) the endpoints starting with `/api` that call the [Google Earth Engine](https://earthengine.google.com/)'s python API and allow the client to create maps, visualise predictors.
It also serves the companion site (ie [home](https://remap-app.org/), [about](https://remap-app.org/about)).

## 2. Remap

Located in the `/app` directory, this is [Remap](https://remap-app.org/remap).
It needs the Python Backend to be running to work locally.
It is a [Vue 2.3](https://vuejs.org/) single page static JavaScript app that is built using webpack.

# Installation

### Setting up and installing the Python Backend
1. Follow the instructions found on: [Earth engine apps](https://developers.google.com/earth-engine/app_engine_intro) to install the Google Cloud SDK.

2. Additionally you will need an [Earth Engine service account](https://developers.google.com/earth-engine/service_account).

3. Add secrets to secrets folder
 * `wsgi.txt` A file with the wsgi key on the first line and an empty second line.
 * `ee_account.txt` A file with the Earth Engine service account name on the first line and an empty second line.
 * `client_secrets.json` A json file that has the OAuth2 details in it. You should download it when you configure the OAuth2 details in the google cloud console.
 * `gee_service_account_secrets.json` A json file that has the earth engine service account details in it. You should download it when you create the service account.

### Installing Remap

1. Install [npm](https://docs.npmjs.com/getting-started/installing-node)
2. Move to the `/app` directory.
3. Run `npm install` to install the required packages.


### Running remap locally
In one terminal run `sh das.sh` to start the dev appserver.
In a new terminal run `sh remap_dev.sh` to start the webpack dev server.

You should be able to find the local site at: http://localhost:8090

### Deploying

If you have made some changes in `/app` you will need to build remap by running `sh build.sh` then you can deploy the built app by running `sh deploy.sh`

# Further information:
The [Remap app](https://remap-app.org/) was developed with funding from a Google Earth Engine Research Award. To find further information about the background, inner workings and methods of Remap please refer to our preprint manuscript on [bioRxiv](https://www.biorxiv.org/content/early/2017/11/01/212464).
[https://www.biorxiv.org/content/early/2017/11/01/212464](https://www.biorxiv.org/content/early/2017/11/01/212464)

Or email: n.murray@unsw.edu.au

#  To cite REMAP:
Murray, N.J., Keith, D.A., Simpson, D., Wilshire, J.H. & Lucas, R.M. (2017) REMAP: An online remote sensing application for land cover classification and monitoring. bioRxiv. DOI: [10.1101/212464](https://www.biorxiv.org/content/early/2017/11/01/212464)
