const express = require('express')
const router = express.Router()
const app = require('../../app')
const auth = require('../auth')
const access = require('../access')
const changesdb = require('../changesdb.js')

// _changes
router.get('/' + app.dbName + '/_changes', auth.isAuthenticated, (req, res) => {
  const query = req.query || {}
  if (query.filter) {
    return auth.unauthorized(res)
  }
  const id = access.calculateOwnerId(req.session.user.name)
  changesdb.changes({ user: id, since: query.since, limit: query.limit }).then((data) => {
    data.spoolChangesProgress = app.spoolChangesProgress
    res.send(data)
  })
})

module.exports = router
