#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const shell = require('shelljs')
const fse = require('fs-extra')
const inquirer = require('inquirer')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))
const routesConfig = db.get('routes')

program
    .action((name, _) => {
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: 'Are you sure to delete this app',
                default: false
            }
        ])
        .then(answers => {
            if (answers.confirmDelete) {
                if (routesConfig.find({name: name}).isUndefined()) {
                    console.log('Can not find this app')
                    return
                }
                const appFullPath = path.join(__dirname, `../../../app/${name}`)
                const repoFullPath = path.join(__dirname, `../../../repo/${name}`)
        
                routesConfig.remove({name: name}).write()
                fse.remove(appFullPath)
                    .then(() => fse.remove(repoFullPath))
                    .then(() => deleteFromPM2(name))
                    .then(() => console.log('Done'))
            }
        })
    })

program.parse(process.argv)

function deleteFromPM2(name) {
    return new Promise((resolve, reject) => {
        shell.exec(`pm2 delete ${name}`, {silent:true}, (code, _, stderr) => {
            if (code !== 0) {
                reject(new Error(stderr))
            }
            resolve()
        })
    })
}