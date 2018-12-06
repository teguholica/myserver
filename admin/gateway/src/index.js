const express = require('express')
const bodyParser = require('body-parser')
const httpProxy = require('express-http-proxy')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))
const app = express()

const routesConfig = db.get('routes').value()

routesConfig.forEach(routeConfig => {
    app.use(`/${routeConfig.route}`, httpProxy(`http://127.0.0.1:${routeConfig.port}`))
    console.log(`path: ${routeConfig.route} port: ${routeConfig.port} running`)
})

app.listen(80, () => console.log('gateway started'))