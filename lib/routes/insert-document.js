const express = require('express')
const router = express.Router()
const app = require('../../app')
const access = require('../access')
const utils = require('../utils')
const auth = require('../auth')

// Insert (or update) a document

router.put('/' + app.dbName + '/:id', auth.isAuthenticated, (req, res) => {
  const id = access.addOwnerId(req.params.id, req.session.user.name)
  if (req.body._id) { // In case the body contains an _id, we need to tweak that, too.
    req.body._id = access.addOwnerId(req.body._id, req.session.user.name)
  }
  app.db.insert(req.body, id, (err, body) => {
    if (err) {
      return utils.sendError(err, res)
    }
    res.send(access.strip(body))
  })
})

module.exports = router
