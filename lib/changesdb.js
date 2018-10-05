const sqlite3 = require('sqlite3').verbose()
const access = require('./access')
let db

// create the database tables and indicies
const setup = (dbName) => {
  db = new sqlite3.Database(dbName + '.sqlite')
  // new database
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // create table
      db.run('CREATE TABLE IF NOT EXISTS changes (change_id INTEGER PRIMARY KEY AUTOINCREMENT, seq_num, INTEGER, seq TEXT, user TEXT, id TEXT, changes TEXT, deleted BOOLEAN DEFAULT true)', err => {
        if (err) {
          reject(err)
        }
      })

      // create index on the id of the user (extracted from the document id)
      db.run('CREATE INDEX IF NOT EXISTS index_user ON changes (seq_num, user)', err => {
        if (err) {
          reject(err)
          return
        }
        resolve(db)
      })
    })
  })
}

// insert an array of changes into the changes database
const insertBulk = (changes) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // create a new transaction
      db.run('begin transaction')

      // for each change in the array, insert a row into the database
      const stmt = db.prepare('INSERT INTO changes (seq, seq_num, user, id, changes, deleted) VALUES ($seq, $seq_num, $user, $id, $changes, $deleted)')
      changes.forEach(change => {
        // extract the id of the user from the id of the document e.g. sue|abc123
        const user = access.extractOwnerId(change.id)
        const deleted = !!change.deleted

        stmt.run({
          $seq: change.seq,
          $seq_num: parseInt(change.seq.split('-')[0]),
          $user: user,
          $id: access.removeOwnerId(change.id), // store the original document id
          $changes: JSON.stringify(change.changes),
          $deleted: deleted
        })
      })

      // commit the transaction
      db.run('commit', err => {
        if (err) {
          console.log('ERR', err)
          return reject(err)
        }

        resolve()
      })
    })
  })
}

// simulate a changes feed, segmented by user,
// given a 'since' and a 'user' and a 'limit'
const changes = (opts) => {
  return new Promise((resolve, reject) => {
    const changeResults = {
      results: [],
      last_seq: '0',
      pending: 0
    }

    if (typeof opts.since === 'undefined') {
      opts.since = 0
    } else {
      const bits = opts.since.split('-')
      if (bits.length > 0) {
        opts.since = parseInt(bits[0])
      } else {
        opts.since = 0
      }
    }
    if (typeof opts.limit === 'undefined') {
      opts.limit = 100
    }
    let select = 'SELECT seq, id,  changes, deleted from changes where seq_num > $since AND user = $user ORDER BY change_id ASC LIMIT $limit'

    // run the query exchanging placeholders for passed-in values
    const params = {
      '$since': opts.since,
      '$user': opts.user,
      '$limit': opts.limit
    }
    db.each(select, params, (err, row) => {
      if (err) {
        return reject(err)
      }
      changeResults.last_seq = row.seq

      // simulate CouchDB changes array
      const change = {
        seq: row.seq,
        id: row.id,
        changes: JSON.parse(row.changes),
        user: row.user
      }

      if (row.deleted === 1) {
        change.deleted = true
      }

      changeResults.results.push(change)
    }, (err) => {
      if (err) {
        return reject(err)
      }

      resolve(changeResults)
    })
  })
}

// get the latest change from the changes feed database
const getLatest = (opts) => {
  let since = '0'
  return new Promise((resolve, reject) => {
    const select = 'SELECT seq from changes ORDER BY seq_num DESC LIMIT 1'

    db.each(select, (err, row) => {
      if (err) {
        return reject(err)
      }
      if (row && row.seq) {
        since = row.seq
      }
    }, (err) => {
      if (err) {
        return reject(err)
      }
      resolve(since)
    })
  })
}

module.exports = {
  setup,
  changes,
  insertBulk,
  getLatest
}
