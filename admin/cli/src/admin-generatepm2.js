#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const dbConfig = low(new FileSync(path.join(__dirname, `../../config.json`)))
const dbPM2 = low(new FileSync(path.join(__dirname, `../../process.json`)))

program
    .action(() => {
        dbPM2.defaults({ apps: [
            {
                script: './gitserver/src/index.js',
                name: 'gitserver',
                exec_mode: 'cluster',
                instances: 1
            },
            {
                script: './gateway/src/index.js',
                name: 'gateway',
                exec_mode: 'cluster',
                instances: 1
            }
        ] }).write()

        dbConfig.get('routes').value().forEach(route => {
            if (route.name === 'repo' || route.name === 'monitor') {
                continue
            }
            if (route.type === 'hosting') {
                dbPM2.get('apps').push({
                    script: 'serve',
                    name: route.name,
                    exec_mode: 'cluster',
                    instances: 1,
                    env: {
                        PM2_SERVE_PATH: path.join(__dirname, `../../../app/${route.name}`),
                        PM2_SERVE_PORT: route.port
                    }
                }).write()
            } else {
                dbPM2.get('apps').push({
                    script: path.join(__dirname, `../../../app/${route.name}/index.js`),
                    name: route.name,
                    exec_mode: 'cluster',
                    instances: 1
                }).write()
            }
        })
        
    })

program.parse(process.argv)