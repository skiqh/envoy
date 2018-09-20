const express = require('express')
const router = express.Router()
const crypto = require('crypto')

const sha1 = (string) => {
  return crypto.createHash('sha1').update(string).digest('hex')
}

// adds owner id to an a document id
// e.g. dog becomes glynn-dog
const addOwnerId = (id, ownerid) => {
  const match = id.match(/_local\/(.*)/)
  const hashownerid = sha1(ownerid)
  if (match) {
    const localid = match[1]
    return '_local/' + hashownerid + '-' + localid
  } else {
    return hashownerid + '-' + id
  }
}

// removes ownerid from a document id
// e.g. glynn-dog becomes dog
const removeOwnerId = (id) => {
  const match = id.match(/_local\/(.*)/)
  if (match) {
    const localid = match[1].replace(/^[^-]+-/, '')
    return '_local/' + localid
  } else {
    return id.replace(/^[^-]+-/, '')
  }
}

// determines whether a document id is owned by ownerid
const myId = (id, ownerid) => {
  const hashownerid = sha1(ownerid)
  return (id.indexOf(hashownerid + '-') === 0 || id.indexOf('_local/' + hashownerid + '-') === 0)
}

// determines whether a doc object is owned by ownerd
const isMine = (doc, ownerid) => {
  return (doc && doc._id && myId(doc._id, ownerid))
}

// strips a document of its ownership information
const strip = (doc) => {
  if (typeof doc === 'object' && doc._id) {
    doc._id = removeOwnerId(doc._id)
  }
  if (typeof doc === 'object' && doc.id) {
    doc.id = removeOwnerId(doc.id)
  }
  return doc
}

// adds
const addAuth = (doc, ownerid) => {
  if (doc._id) {
    doc._id = addOwnerId(doc._id, ownerid)
  }
  return doc
}

// stream transformer that removes auth details from documents
const authRemover = require('./common/authremover.js')(myId, removeOwnerId)

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
