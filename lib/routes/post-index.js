const express = require('express')
const router = express.Router()
const app = require('../../app')
const utils = require('../utils')
const auth = require('../auth')

// don't allow the creation of indexes via Envoy API
router.post('/' + app.dbName + '/_index', auth.isAuthenticated, (req, res) => {
  const err = {
    statusCode: 404,
    error: 'Not Found',
    reason: 'Not supported in Envoy'
  }
  return utils.sendError(err, res)
})

module.exports = router
