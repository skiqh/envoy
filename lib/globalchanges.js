
const app = require('../app')
const ChangesReader = require('changesreader')
const changesdb = require('./changesdb.js')
let changesReader = null

// process each array of changes
const processBatch = (b) => {
  changesdb.insertBulk(b).catch(console.error)
}

const extractSequenceNumber = (seq) => {
  return parseInt(seq.replace(/-.*$/, ''))
}

// spool all the changes from '0' to 'now'
const spool = () => {
  // use a fresh Nano object and the ChangesReader library
  changesReader = new ChangesReader(app.dbName, app.cloudant.request)
  let lastSeq = 0

  // return a Promise
  return new Promise((resolve, reject) => {
    // get database info
    const req = { db: app.dbName, path: '_changes', qs: { since: 'now', limit: 1 } }
    app.cloudant.request(req).then((data) => {
      lastSeq = extractSequenceNumber(data['last_seq'])
      return changesdb.getLatest()
    }).then((since) => {
      let total = 0
      // spool changes from 0. The short timeout ensures that
      // empty databases don't cause a long wait time.
      changesReader.spool({ since: since })
        .on('batch', (b) => {
          total += b.length
          processBatch(b)
          const latest = b[b.length - 1]
          const thisSeq = extractSequenceNumber(latest.seq)
          app.spoolChangesProgress = Math.floor(100 * thisSeq / lastSeq)
          process.stdout.write('  ' + total + ' (' + app.spoolChangesProgress + '%)\r')
        })
        .on('end', (lastSeq) => {
          // all done
          app.spoolChangesProgress = 100
          process.stdout.write('\n')
          resolve(lastSeq)
        })
        .on('error', (e) => {
          // something bad happened, such as could not log in.
          reject(new Error('changes feed spooling failed'))
        })
    })
  })
}

// monitor changes from 'now'
const start = (since) => {
  changesReader = new ChangesReader(app.dbName, app.cloudant.request)
  changesReader.start({ since: since }).on('batch', processBatch)
}

module.exports = {
  start: start,
  spool: spool
}
