#!/usr/bin/env node

const program = require('commander')
const NodeGit = require('nodegit')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const pm2 = require('pm2')
const shell = require('shelljs')

const helpers = require('./helpers')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))
const routesConfig = db.get('routes')

program
    .action((name, cmd) => {
        inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'App Type',
            choices: ['API', 'Worker', 'Hosting']
          }
        ])
        .then(answers => {
            if (answers.type === 'API') {
                newAPI()
            } else if (answers.type === 'Worker') {
                newWorker()
            } else {
                newHosting()
            }
        })
    })

program.parse(process.argv)

function newAPI() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'API Name'
        },
        {
            type: 'input',
            name: 'route',
            message: 'API Route'
        },
        {
            type: 'input',
            name: 'port',
            message: 'API Port'
        }
      ])
      .then(answers => {
            checkRouteAvailability(answers.name, answers.route, answers.port)
                .then(() => createRepo(answers.name))
                .then(() => routeRegister('api', answers.name, answers.route, answers.port))
                .then(() => restartGateway())
                .then(() => console.log('Done'))
                .catch(err => {
                    console.log(`error : ${err.message}`)
                    process.exit(1)
                })
      })
}

function newWorker() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Worker Name'
        }
      ])
      .then(answers => {
          
      })
}

function newHosting() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Hosting Name'
        },
        {
            type: 'input',
            name: 'route',
            message: 'Hosting Route'
        },
        {
            type: 'input',
            name: 'port',
            message: 'Hosting Port'
        }
      ])
      .then(answers => {
        checkRouteAvailability(answers.name, answers.route, answers.port)
            .then(() => createRepo(answers.name))
            .then(() => routeRegister('hosting', answers.name, answers.route, answers.port))
            .then(() => restartGateway())
            .then(() => serveHosting(answers.name, answers.port))
            .then(() => console.log('Done'))
            .catch(err => {
                console.log(`error : ${err.message}`)
                process.exit(1)
            })
      })
}

function serveHosting(name, port) {
    return new Promise((resolve, reject) => {
        shell.exec(`mkdir ${path.join(__dirname, `../../../app/${name}`)} && pm2 serve --name ${name} ${path.join(__dirname, `../../../app/${name}`)} ${port}`, {silent:true}, (code, stdout, stderr) => {
            if (code !== 0) {
                reject(new Error(stderr))
            }
            resolve()
        })
    })
}

function checkRouteAvailability(name, route, port) {
    if (!routesConfig.find({name: name}).isUndefined().value()) {
        const currentRouteConfig = routesConfig.find({name: name}).value()
        return Promise.reject(new Error(`This app has been publish in port ${currentRouteConfig.port}`))
    } else if (!routesConfig.find({route: route}).isUndefined().value()) {
        const currentRouteConfig = routesConfig.find({port: port}).value()
        return Promise.reject(new Error(`Route is used by ${currentRouteConfig.name}`))
    } else if (!routesConfig.find({port: port}).isUndefined().value()) {
        const currentRouteConfig = routesConfig.find({port: port}).value()
        return Promise.reject(new Error(`Port is used by ${currentRouteConfig.name}`))
    }
    return Promise.resolve()
}

function createRepo(name) {
    return NodeGit.Repository.init(path.join(__dirname, `../../../repo/${name}`), 1)
        .then(() => {
            return new Promise((resolve, reject) => {
                const postReceivePath = path.join(__dirname, `../../../repo/${name}/hooks/post-receive`)
                const postReceive = helpers.generatePostReceive(name)
                fs.writeFile(postReceivePath, postReceive, err => {
                    if(err) reject(err)
                    resolve(postReceivePath)
                })
            })
        })
        .then((postReceivePath) => {
            return new Promise((resolve, reject) => {
                fs.chmod(postReceivePath, 0755, (err) => {
                    if(err) reject(err)
                    resolve()
                })
            })
        })
}

function routeRegister(type, name, route, port) {
    return new Promise((resolve, _) => {
        routesConfig.push({
            type: type,
            name: name,
            route: route,
            port: port
        }).write()
        resolve()
    })
}

function restartGateway() {
    return new Promise((resolve, reject) => {
        pm2.connect(err => {
            if (err) reject(err)
            resolve()
        })
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            pm2.restart('gateway', (err, _) => {
                if (err) reject(err)
                resolve()
            })
        })
    })
    .then(() => {
        return new Promise((resolve, _) => {
            pm2.disconnect()
            resolve()
        })
    })
}