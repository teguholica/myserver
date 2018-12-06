const dedent = require('dedent')
const path = require('path')
const fs = require('fs')

const helpers = {
    generatePostReceive: (name) => {
        return dedent(`
        #!/bin/bash
        admin postreceive ${name}
        `)
    },
    getListOfDir: (source) => {
        return new Promise((resolve, reject) => {
            try {
                const dirList = fs.readdirSync(source).filter(name => fs.lstatSync(path.join(source, name)).isDirectory())
                resolve(dirList)
            } catch (err) {
                reject(err)
            }
        })
    }
}

module.exports = helpers