const express = require('express')
const router = express.Router()
const app = require('../../app')
const access = require('../access')
const utils = require('../utils')
const rawParser = require('body-parser').raw({ type: '*/*' })
const auth = require('../auth')

router.put('/' + app.dbName + '/:id/*', auth.isAuthenticated, rawParser, (req, res) => {
  const id = access.addOwnerId(req.params.id, req.session.user.name)
  app.db.attachment.insert(id, req.params['0'], req.body, req.headers['content-type'], req.query, (err, body) => {
    if (err) {
      return utils.sendError(err, res)
    }
    res.send(access.strip(body))
  })
})

module.exports = router
