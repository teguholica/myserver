#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const pm2 = require('pm2')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))

program
    .action((name, cmd) => {
        console.log(name)
        const routesConfig = db.get('routes')
        if (routesConfig.find({name: name}).isUndefined().value()) {
            console.log('App does not published')
            return
        }
        routesConfig.remove({name: name}).write()
        unpublishApp(name)
        .then(() => console.log(`App Unpublished`))
        .catch(err => console.log(`error : ${err.message}. Please restart gateway from PM2 manually`))
        
    })

program.parse(process.argv)

function unpublishApp(name) {
    return new Promise((resolve, reject) => {
        pm2.connect(err => {
            if (err) reject(err)
            resolve()
        })
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            pm2.stop(name, (err, apps) => {
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