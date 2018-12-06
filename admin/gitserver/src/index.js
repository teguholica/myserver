const path = require('path')
const Server = require('node-git-server')
const repos = new Server(path.join(__dirname, '../../../repo'), {
    autoCreate: true
})

repos.on('push', (push) => {
    console.log(`push ${push.repo}/${push.commit} (${push.branch})`)
    push.accept()
});

repos.on('fetch', (fetch) => {
    console.log(`fetch ${fetch.commit}`)
    fetch.accept()
});

repos.listen(7005, () => {
    console.log(`gitserver running at http://localhost:7005`)
});