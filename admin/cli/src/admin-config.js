#!/usr/bin/env node

const program = require('commander')
const NodeGit = require('nodegit')
const fs = require('fs')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const helpers = require('./helpers')

const db = low(new FileSync(path.join(__dirname, `../../config.json`)))

program
    .action((key, value, cmd) => {
        db.set(key, value).write()
    })

program.parse(process.argv)