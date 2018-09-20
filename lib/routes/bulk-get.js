// NOTE: The _bulk_get end point does not return its results line-by-line
// as e.g. _changes.
//
// NOTE: The response format is convoluted, and seemingly undocumented.
//
//  "results": [
// {
//   "id": "1c43dd76fee5036c0cb360648301a710",
//   "docs": [
//     {
//       "ok": { ..doc body here...
//
//         }
//       }
//     }
//   ]
// },
//
// Not sure if the "docs" array can ever contain multiple items.

const express = require('express')
const router = express.Router()
const app = require('../../app')
const auth = require('../auth')
const access = require('../access')
const utils = require('../utils')

// Pouch does this to check it exists
router.get('/' + app.dbName + '/_bulk_get', auth.isAuthenticated, (req, res) => {
  res.status(405)
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get'
  }).pipe(res)
})

router.post('/' + app.dbName + '/_bulk_get', auth.isAuthenticated, (req, res) => {
  // add ownerids to incoming ids
  if (req.body && req.body.docs) {
    req.body.docs = req.body.docs.map((doc) => {
      doc.id = access.addOwnerId(doc.id, req.session.user.name)
      return doc
    })
  }
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get',
    method: 'POST',
    body: req.body
  }, (err, data) => {
    if (err) {
      return utils.sendError(err, res)
    }
    const results = data.results.map((row) => {
      const stripped = Object.assign({}, row)
      stripped.id = access.removeOwnerId(stripped.id)
      stripped.docs.forEach((item) => {
        if (item.ok) {
          access.strip(item.ok)
        }
        if (item.error) {
          access.strip(item.error)
        }
      })
      return stripped
    })
    res.send({ results: results })
  })
})

module.exports = router
