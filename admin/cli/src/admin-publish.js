#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const pm2 = require('pm2')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))

program
    .action((name, subdomain, port, cmd) => {
        const generalConfig = db.get('general')
        const routesConfig = db.get('routes')
        if (!routesConfig.find({name: name}).isUndefined().value()) {
            const currentRouteConfig = routesConfig.find({name: name}).value()
            console.log(`This app has been publish in port ${currentRouteConfig.port}`)
            return
        } else if (!routesConfig.find({subdomain: subdomain}).isUndefined().value()) {
            const currentRouteConfig = routesConfig.find({port: port}).value()
            console.log(`Subdomain is used by ${currentRouteConfig.name}`)
            return
        } else if (!routesConfig.find({port: port}).isUndefined().value()) {
            const currentRouteConfig = routesConfig.find({port: port}).value()
            console.log(`Port is used by ${currentRouteConfig.name}`)
            return
        }
        routesConfig.push({
            name: name,
            subdomain: subdomain,
            port: port
        }).write()
        publishApp(name)
        .then(() => console.log(`Published`))
        .catch(err => console.log(`error : ${err.message}. Please restart gateway from PM2 manually`))
        
    })

program.parse(process.argv)

function publishApp(name) {
    return new Promise((resolve, reject) => {
        pm2.connect(err => {
            if (err) reject(err)
            resolve()
        })
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            pm2.start({
                name: name,
                script: path.join(__dirname, `../../../app/${name}/index.js`),
                exec_mode: 'cluster',
                watch: true
            }, (err, apps) => {
                if (err) reject(err)
                resolve()
            })
        })
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            pm2.restart('gateway', (err, apps) => {
                if (err) reject(err)
                resolve()
            })
        })
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            pm2.disconnect()
            resolve()
        })
    })
}