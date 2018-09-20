const express = require('express')
const router = express.Router()
const app = require('../../app')
const auth = require('../auth')

router.get('/' + app.dbName, auth.isAuthenticated, (req, res) => {
  app.db.get('').pipe(res)
})

module.exports = router
