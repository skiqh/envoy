const express = require('express')
const router = express.Router()
const app = require('../../app')
const access = require('../access')
const utils = require('../utils')
const auth = require('../auth')

// Authenticated request to /db/_find
// The user posts their query to /db/_find.
// We modify their query so that it only
// includes their documents.
router.post('/' + app.dbName + '/_find', auth.isAuthenticated, (req, res) => {
  // Authenticate the documents requested
  const body = req.body

  // merge the user-supplied query with a search for this user's docs
  if (body && body.selector) {
    const filter = {
      $and: [
        {
          '_id': { '$regex': '^' + access.addOwnerId('', req.session.user.name) }
        },
        body.selector
      ]
    }
    body.selector = filter
  }

  app.db.find(body)
    .pipe(utils.liner())
    .pipe(access.authRemover(req.session.user.name))
    .pipe(res)
})

module.exports = router
