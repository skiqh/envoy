/* eslint-env mocha */
'use strict'
/* globals testUtils */

var assert = require('assert')

var app = require('../app')

var PouchDB = require('pouchdb')

describe('POST /all_docs', function () {
  var docCount = 5

  var docs = null

  var docs2 = null

  var url1 = null

  var res1 = null

  var remote = null

  var remote2 = null

  before(function () {
    // create two users, one who has 5 docs, the other 10, in the
    // the same database. Ensure that each user gets only their own data
    docs = testUtils.makeDocs(docCount)
    docs2 = testUtils.makeDocs(docCount * 2)

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      url1 = remoteURL.replace(/\/[a-z0-9]+$/, '')
      return remote.bulkDocs(docs)
    }).then(function (response) {
      res1 = response
      assert.strictEqual(response.length, docCount, response)
      response.forEach(function (row) {
        assert(!row.error)
      })
      return testUtils.createUser()
    }).then(function (remoteURL2) {
      remote2 = new PouchDB(remoteURL2)
      return remote2.bulkDocs(docs2)
    })
  })

  it('POST /db/_all_docs with no parameters', function (done) {
    var cloudant = require('nano')(url1)
    var r = {
      method: 'post',
      db: app.dbName,
      path: '_all_docs'
    }
    cloudant.request(r, function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(typeof row.doc, 'object')
        assert.strictEqual(row.id, row.key)
      })
      done()
    })
  })

  it('POST /db/_all_docs with keys parameters', function (done) {
    var keys = []
    res1.forEach(function (row) {
      keys.push(row.id)
      assert(!row.error)
    })

    var cloudant = require('nano')(url1)
    var r = {
      method: 'post',
      db: app.dbName,
      path: '_all_docs',
      body: { keys: keys }
    }
    cloudant.request(r, function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(row.id, row.key)
        assert.strictEqual(typeof row.doc, 'object')
      })
      done()
    })
  })
})
