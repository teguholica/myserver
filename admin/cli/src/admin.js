#!/usr/bin/env node

const program = require('commander')

program
  .version('1.0.0')
  .command('config <key> <value>', 'edit config')
  .command('new', 'Registering new app')
  .command('publish <name> <subdomain> <port>', 'publish app to PM2')
  .command('unpublish <name>', 'unpublish app from PM2')
  .command('list', 'list packages installed')
  .command('postreceive', 'post-receive for repo')
  .parse(process.argv)