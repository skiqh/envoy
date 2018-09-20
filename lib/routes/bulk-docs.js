const express = require('express')
const router = express.Router()
const app = require('../../app')
const access = require('../access')
const utils = require('../utils')
const uuid = require('uuid')
const auth = require('../auth')

const filterReply = (reply) => {
  for (let i in reply) {
    reply[i] = access.strip(reply[i])
  }
  return reply
}

// _bulk_docs
router.post('/' + app.dbName + '/_bulk_docs', auth.isAuthenticated, (req, res) => {
  const newEdits = typeof req.body.new_edits === 'undefined' ? true : req.body.new_edits

  // Iterate through docs, adding uuids when missing and adding owner ids
  let doclist = req.body.docs
  if (req.body && req.body.docs && req.body.docs.length) {
    doclist = req.body.docs.map((doc) => {
      if (typeof doc === 'object') {
        if (doc._id) {
          doc._id = access.addOwnerId(doc._id, req.session.user.name)
        } else {
          doc._id = access.addOwnerId(uuid.v4(), req.session.user.name)
        }
      }
      return doc
    })
  }

  app.db.bulk({ docs: doclist, new_edits: newEdits }, (err, body) => {
    if (err) {
      return utils.sendError(err, res)
    }
    res.send(filterReply(body))
  })
})

module.exports = router
