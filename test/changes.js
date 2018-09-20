/* eslint-env mocha */
'use strict'
/* globals testUtils */

var assert = require('assert')

var PouchDB = require('pouchdb')

describe('changes', function () {
  it('sequence', function () {
    var docCount = 2
    var docs = testUtils.makeDocs(docCount)

    var remote = null

    var seq1 = ''

    var id; var rev

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.bulkDocs(docs)
    }).then(function () {
      return remote.changes()
    }).then(function (response) {
      // testUtils.d('FIRST', response);
      assert(response.results)
      assert(response.results.length >= 1)
      seq1 = response.last_seq
      // Update a document
      var newDoc = testUtils.makeDocs(1)[0]
      newDoc._id = response.results[0].id
      newDoc._rev = response.results[0].changes[0].rev
      return remote.put(newDoc)
    }).then(function (response) {
      id = response.id
      rev = response.rev
      return remote.changes({ since: seq1 })
    }).then(function (response) {
      // testUtils.d('FINAL', response);
      assert.strictEqual(response.results.length, 1,
        'Changes feed should contain single entry')
      assert.strictEqual(response.results[0].id, id,
        'ID of document should be the one that was updated')
      assert.strictEqual(response.results[0].changes[0].rev, rev,
        'Rev of document should be the one that was updated')
    }).catch(function (error) {
      console.log(error)
    })
  })

  it('changes with filter is not allowed', function () {
    var remote = null

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.changes({ filter: 'x' })
    }).then(function (r) {
      assert(false)
    }).catch(function (e) {
      assert.strictEqual(e.status, 403)
    })
  })
})
