const express = require('express')
const router = express.Router()
const app = require('../../app')
const request = require('request')

router.get('/', (req, res) => {
  request(app.serverURL).pipe(res)
})

module.exports = router
