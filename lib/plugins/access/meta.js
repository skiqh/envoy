const stream = require('stream')
const express = require('express')
const auth = require('../../auth')
const app = require('../../../app')
const router = express.Router()

// add custom route
router.get('/_auth', auth.isAuthenticated, (req, res) => {
  res.send({
    loggedin: true,
    username: req.session.user.name
  })
})

// adds owner id to an a document id
// e.g. dog becomes glynn-dog
const addOwnerId = (id, ownerid) => {
  return id
}

// removes ownerid from a document id
// e.g. glynn-dog becomes dog
const removeOwnerId = (id) => {
  return id
}

const myId = (id, ownerid) => {
  return null
}

// determines whether a doc object is owned by ownerd
const isMine = (doc, ownerid) => {
  return (doc && doc[app.metaKey] && doc[app.metaKey].ownerid &&
            doc[app.metaKey].ownerid === ownerid)
}

// strips a document of its ownership information
const strip = (doc) => {
  delete doc[app.metaKey]
  return doc
}

// adds
const addAuth = (doc, ownerid) => {
  doc[app.metaKey] = { ownerid: ownerid }
  return doc
}

// stream transformer that removes auth details from documents
const authRemover = (onlyuser, removeDoc) => {
  let firstRecord = true

  const stripAuth = (obj, onlyuser, removeDoc) => {
    let chunk = obj

    // If the line ends with a comma, this would break JSON parsing.
    if (obj.endsWith(',')) {
      chunk = obj.slice(0, -1)
    }

    let row
    try {
      row = JSON.parse(chunk)
    } catch (e) {
      return obj + '\n' // An incomplete fragment: pass along as is.
    }

    // when simulating _all_docs with a view, we need to swap out
    // the key to equal the doc._id
    if (row.key && row.id && row.key !== row.id) {
      row.key = row.id
    }

    // Successfully parsed a doc line. Remove auth field.
    if (row.doc) {
      if (row.doc[app.metaKey]) {
        const meta = row.doc[app.metaKey]
        if (onlyuser && meta.ownerid && meta.ownerid !== onlyuser) {
          return ''
        }
        strip(row.doc)
      } else {
        // if doc has no metaKey, then it should not be returned
        return ''
      }
    }

    // if we need to remove the doc object
    if (removeDoc) {
      delete row.doc
    }

    // cloudant query doesn't return a .doc
    delete row[app.metaKey]

    // Repack, and add the trailling comma if required
    const retval = JSON.stringify(row)
    if (firstRecord) {
      firstRecord = false
      return retval + ''
    } else {
      return ',\n' + retval
    }
  }

  const tr = new stream.Transform({ objectMode: true })
  tr._transform = function (obj, encoding, done) {
    const data = stripAuth(obj, onlyuser, removeDoc)
    if (data) {
      this.push(data)
    }
    done()
  }
  return tr
}

module.exports = () => {
  return {
    addOwnerId: addOwnerId,
    removeOwnerId: removeOwnerId,
    myId: myId,
    isMine: isMine,
    strip: strip,
    addAuth: addAuth,
    authRemover: authRemover,
    routes: router
  }
}
