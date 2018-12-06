#!/usr/bin/env node

const program = require('commander')
const Table = require('cli-table2')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const helpers = require('./helpers')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))

program
    .action(cmd => {
        helpers.getListOfDir(path.join(__dirname, `../../../repo`))
            .then(dirList => {
                const generalConfig = db.get('general').value()
                const routesConfig = db.get('routes')
                const table = new Table({
                    head: ['App Name', 'GIT URL', 'Route', 'Port'],
                    colWidths: [20, 40, 20, 10]
                })

                const repoList = dirList.map(name => {
                    const routeConfig = routesConfig.find({name: name})
                    return [
                        name,
                        `${generalConfig.protocol}://${generalConfig.domain}/repo/${name}`,
                        routeConfig.isUndefined().value() ? '' : routeConfig.value().route,
                        routeConfig.isUndefined().value() ? '' : routeConfig.value().port
                    ]
                })
                repoList.forEach(repo => {
                    table.push(repo)
                })

                console.log(table.toString())
            })
    })

program.parse(process.argv)