const express = require('express')
const router = express.Router()
const app = require('../../app')
const auth = require('../auth')
const access = require('../access')
const utils = require('../utils')
const globalchanges = require('../globalchanges.js')

// _changes
router.get('/' + app.dbName + '/_changes', auth.isAuthenticated, (req, res) => {
  const query = req.query || {}
  if (query.filter) {
    return auth.unauthorized(res)
  }

  // if we know the sequence number when a user was created
  // then there's no need to get changes before that point
  if ((typeof query.since === 'undefined' || query.since === '0') && req.session.user.seq) {
    query.since = req.session.user.seq
  }

  if (query.since === 'now' && query.feed === 'continuous') {
    // global changes feed
    globalchanges.subscribe(req.session.user.name, res, (query.include_docs === 'true'))
  } else {
    // use Mango filtering https://github.com/apache/couchdb-couch/pull/162
    query.filter = '_selector'
    const prefix = access.addOwnerId('', req.session.user.name)
    const selector = {
      selector: {
        '_id': { '$gt': prefix,
          '$lt': prefix + 'z'
        }
      }
    }

    // query filtered changes
    app.cloudant.request({
      db: app.dbName,
      path: '_changes',
      qs: query,
      method: 'POST',
      body: selector
    }).pipe(utils.liner())
      .pipe(access.authRemover())
      .pipe(res)
  }
})

module.exports = router
