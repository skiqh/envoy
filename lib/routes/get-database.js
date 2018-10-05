const express = require('express')
const router = express.Router()
const app = require('../../app')
const auth = require('../auth')

router.get('/' + app.dbName, auth.isAuthenticated, (req, res) => {
  app.db.info().then((data) => {
    res.send(data)
  })
})

module.exports = router
