const express = require('express')
const router = express.Router()
const app = require('../../app')
const access = require('../access')
const auth = require('../auth')
const utils = require('../utils')

router.delete('/' + app.dbName + '/:id/*', auth.isAuthenticated, (req, res) => {
  const id = access.addOwnerId(req.params.id, req.session.user.name)
  app.db.attachment.destroy(id, req.params['0'], req.query, (err, body) => {
    if (err) {
      return utils.sendError(err, res)
    }
    res.send(access.strip(body))
  })
})

module.exports = router
