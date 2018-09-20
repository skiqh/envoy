/* eslint-env mocha */
'use strict'
/* globals testUtils */

var assert = require('assert')

var PouchDB = require('pouchdb')

describe('GET all_docs', function () {
  it('GET /db/_all_docs with no parameters', function () {
    // create two users, one who has 5 docs, the other 10, in the
    // the same database. Ensure that each user gets only their own data
    var docCount = 5

    var docs = testUtils.makeDocs(docCount)

    var docs2 = testUtils.makeDocs(docCount * 2)

    var remote = null

    var remote2 = null

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.bulkDocs(docs)
    }).then(function (response) {
      assert.strictEqual(response.length, docCount, response)
      response.forEach(function (row) {
        assert(!row.error)
      })

      return testUtils.createUser()
    }).then(function (remoteURL2) {
      remote2 = new PouchDB(remoteURL2)
      return remote2.bulkDocs(docs2)
    }).then(function (response) {
      // ensure we can retrieve what we inserted
      return remote.allDocs()
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(typeof row.doc, 'undefined')
        assert.strictEqual(row.id, row.key)
      })
      return remote2.allDocs()
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount * 2)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(typeof row.doc, 'undefined')
        assert.strictEqual(row.id, row.key)
      })
    })
  })

  it('GET /db/_all_docs with include_docs=true parameter', function () {
    // create two users, one who has 5 docs, the other 10, in the
    // the same database. Ensure that each user gets only their own data
    var docCount = 5

    var docs = testUtils.makeDocs(docCount)

    var docs2 = testUtils.makeDocs(docCount * 2)

    var remote = null

    var remote2 = null

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.bulkDocs(docs)
    }).then(function (response) {
      assert.strictEqual(response.length, docCount, response)
      response.forEach(function (row) {
        assert(!row.error)
      })

      return testUtils.createUser()
    }).then(function (remoteURL2) {
      remote2 = new PouchDB(remoteURL2)
      return remote2.bulkDocs(docs2)
    }).then(function (response) {
      // ensure we can retrieve what we inserted
      return remote.allDocs({ include_docs: true })
    }).then(function (data) {
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
      return remote2.allDocs({ include_docs: true })
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount * 2)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(row.id, row.key)
        assert.strictEqual(typeof row.doc, 'object')
      })
    })
  })

  it('GET /db/_all_docs with keys parameters', function () {
    var docCount = 5

    var docs = testUtils.makeDocs(docCount)

    var remote = null

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.bulkDocs(docs)
    }).then(function (response) {
      assert.strictEqual(response.length, docCount, response)
      var keys = []
      response.forEach(function (row) {
        keys.push(row.id)
        assert(!row.error)
      })

      // remove first two items from keys
      // we want to only ask for 3 docs
      keys.splice(0, 2)

      // ensure we can retrieve what we inserted
      return remote.allDocs({ keys: keys })
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount - 2)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(row.id, row.key)
        // it turns out PouchDB is actually calling POST /db/_all_docs
        // and Nano is adding include_docs: true whether you like it or not
        // https://github.com/dscape/nano/blame/master/lib/nano.js#L476
        // commenting this out for now
        // assert.strictEqual(typeof row.doc,'undefined');
      })
    })
  })

  it('GET /db/_all_docs with keys and include_docs=true', function () {
    var docCount = 5

    var docs = testUtils.makeDocs(docCount)

    var remote = null

    return testUtils.createUser().then(function (remoteURL) {
      remote = new PouchDB(remoteURL)
      return remote.bulkDocs(docs)
    }).then(function (response) {
      assert.strictEqual(response.length, docCount, response)
      var keys = []
      response.forEach(function (row) {
        keys.push(row.id)
        assert(!row.error)
      })

      // remove first two items from keys
      // we want to only ask for 3 docs
      keys.splice(0, 2)

      // ensure we can retrieve what we inserted
      return remote.allDocs({ keys: keys, include_docs: true })
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data.rows, 'object')
      assert.strictEqual(data.rows.length, docCount - 2)
      data.rows.forEach(function (row) {
        assert.strictEqual(typeof row, 'object')
        assert.strictEqual(typeof row.id, 'string')
        assert.strictEqual(typeof row.key, 'string')
        assert.strictEqual(typeof row.value, 'object')
        assert.strictEqual(row.id, row.key)
        assert.strictEqual(typeof row.doc, 'object')
      })
    })
  })
})
