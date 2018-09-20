/* eslint-env mocha */
'use strict'
/* globals testUtils */

var PouchDB = require('pouchdb')

var assert = require('assert')

// Generate a bunch of documents, and store those in a local
// PouchDB. Kick off a push replication, and then query remote
// end to ensure that all generated documents made it acrosss.
describe('two way sync', function () {
  var dbs = {}
  beforeEach(function (done) {
    dbs = { local: 'testdb' }
    testUtils.cleanup([dbs.local], done)
  })

  afterEach(function (done) {
    testUtils.cleanup([dbs.local], done)
  })

  it('ensure no conflicts arise for push pull sync', function () {
    var local = new PouchDB(dbs.local)
    var remote = null
    var docs = testUtils.makeDocs(5)

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.allDocs()
    }).then(function (response) {
      assert.strictEqual(response.rows.length, 0)
      return local.bulkDocs(docs)
    }).then(function () {
      return local.replicate.to(remote)
    }).then(function () {
      // Verify that all documents reported as pushed are present
      // on the remote side.
      return remote.replicate.to(local)
    }).then(function () {
      return local.allDocs({ conflicts: true })
    }).then(function (data) {
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row._conflicts, 'undefined')
      })
    })
  })

  it('ensure no conflicts arise for pull push sync', function () {
    var local = new PouchDB(dbs.local)
    var remote = null
    var docs = testUtils.makeDocs(5)

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.allDocs()
    }).then(function (response) {
      assert.strictEqual(response.rows.length, 0)
      return remote.bulkDocs(docs)
    }).then(function () {
      return remote.replicate.to(local)
    }).then(function () {
      // Verify that all documents reported as pushed are present
      // on the remote side.
      return local.replicate.to(remote)
    }).then(function () {
      return remote.allDocs({ conflicts: true })
    }).then(function (data) {
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row._conflicts, 'undefined')
      })
    })
  })
})
