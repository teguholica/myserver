#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const pm2 = require('pm2')
const shell = require('shelljs')
const fse = require('fs-extra')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))

program
    .action((name, cmd) => {
        const routeConfig = db.get('routes').find({name: name}).value()
        const repoFullPath = path.join(__dirname, `../../../repo/${name}`)
        const appFullPath = path.join(__dirname, `../../../app/${name}`)

        if (routeConfig.type === 'api') {
            postReceiveAPI(name, appFullPath, repoFullPath)
        } else if (routeConfig.type === 'worker') {
            postReceiveWorker(name, appFullPath, repoFullPath)
        } else if (routeConfig.type === 'hosting') {
            postReceiveHosting(name, appFullPath, repoFullPath)
        }
    })

program.parse(process.argv)

function postReceiveAPI(name, appFullPath, repoFullPath) {
    fse.remove(appFullPath)
        .then(() => fse.mkdir(appFullPath))
        .then(() => checkout(appFullPath, repoFullPath))
        .then(() => npmInstall(appFullPath))
        .then(() => connectPM2())
        .then(() => checkAppRegisteredToPM2(name))
        .then(isRegistered => {
            if (isRegistered)
                return restartApp(name)
            else
                return startApp(name)
        })
        .then(() => {
            pm2.disconnect()
            console.log('Done')
        })
        .catch(err => console.log(`error : ${err.message}`))
}

function postReceiveWorker() {

}

function postReceiveHosting(name, appFullPath, repoFullPath) {
    fse.remove(appFullPath)
        .then(() => fse.mkdir(appFullPath))
        .then(() => checkout(appFullPath, repoFullPath))
        .then(() => {
            console.log('Done')
        })
        .catch(err => console.log(`error : ${err.message}`))
}

function checkout(appFullPath, repoFullPath) {
    return new Promise((resolve, reject) => {
        console.log('Checkout')
        shell.exec(`git --work-tree=${appFullPath} --git-dir=${repoFullPath} checkout --force`, {silent:true}, function(code, stdout, stderr) {
            if (code !== 0) {
                reject(new Error(stderr))
            }
            resolve()
          })
    })
}

function npmInstall(appFullPath) {
    return new Promise((resolve, reject) => {
        console.log('NPM install')
        shell.exec(`cd ${appFullPath} && npm install`, {silent:true}, function(code, stdout, stderr) {
            if (code !== 0) {
                reject(new Error(stderr))
            }
            resolve()
          })
    })
}

function connectPM2() {
    return new Promise((resolve, reject) => {
        console.log('Connect PM2')
        pm2.connect(err => {
            if (err) reject(err)
            resolve()
        })
    })
}

function checkAppRegisteredToPM2(name) {
    return new Promise((resolve, reject) => {
        pm2.describe(name, (err, info) => {
            if (err) reject(err)
            if (info.length === 0) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

function startApp(name) {
    return new Promise((resolve, reject) => {
        console.log('Start App')
        pm2.start({
            name: name,
            script: path.join(__dirname, `../../../app/${name}/index.js`),
            exec_mode: 'cluster',
            autorestart: false
        }, (err, apps) => {
            if (err) reject(err)
            resolve()
        })
    })
}

function restartApp(name) {
    return new Promise((resolve, reject) => {
        console.log('Restart App')
        pm2.restart(name, (err, apps) => {
            if (err) reject(err)
            resolve()
        })
    })
}