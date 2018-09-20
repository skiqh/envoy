/* eslint-env mocha */
'use strict'
/* globals testUtils */

var assert = require('assert')

var PouchDB = require('pouchdb')

var ATT_TXT = Buffer.from('abc').toString('base64')

var ATT_TXT2 = Buffer.from('Hello World').toString('base64')

var localBob = null

var remoteBob = null

describe('CRUD', function () {
  var dbs = { local: 'testdb', secondary: 'testdb2' }

  it('test cleanup', function (done) {
    testUtils.cleanup([dbs.local, dbs.secondary], function () {
      localBob = new PouchDB(dbs.local)
      done()
    })
  })

  it('create user', function () {
    return testUtils.createUser(2).then(function (urls) {
      remoteBob = new PouchDB(urls[0])
    })
  })

  it('create an attachment and replicate it', function () {
    return localBob.putAttachment('mydoc', 'att.txt', ATT_TXT, 'text/plain').then(function (data) {
      assert.strictEqual(typeof data, 'object')
      return localBob.replicate.to(remoteBob)
    }).then(function () {
      assert(true)
    }).catch(function (e) {
      // shouldn't get here'
      assert(false)
    })
  })

  it('replicate attachment back again', function () {
    return localBob.replicate.from(remoteBob).then(function (d) {
      return localBob.get('mydoc')
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(typeof data._attachments, 'object')
      assert.strictEqual(typeof data._attachments['att.txt'], 'object')
      assert.strictEqual(data._attachments['att.txt'].content_type, 'text/plain')
    }).catch(function (e) {
      // shouldn't get here'
      assert(false)
    })
  })

  it('fetch attachment from the server', function () {
    return remoteBob.getAttachment('mydoc', 'att.txt').then(function (data) {
      data = data.toString('utf8')
      assert.strictEqual(data, 'abc')
    }).catch(function (e) {
      // shouldn't get here
      console.log(e.toString())
      assert(false)
    })
  })

  it('update an attachment from the server', function () {
    return remoteBob.get('mydoc').then(function (data) {
      return remoteBob.putAttachment('mydoc', 'att.txt', data._rev, ATT_TXT2, 'text/plain')
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(data.id, 'mydoc')
      assert.strictEqual(typeof data.rev, 'string')
      assert.strictEqual(data.ok, true)
    }).catch(function (e) {
      // shouldn't get here
      assert(false)
    })
  })

  it('delete an attachment from the server', function () {
    return remoteBob.get('mydoc').then(function (data) {
      return remoteBob.removeAttachment('mydoc', 'att.txt', data._rev)
    }).then(function (data) {
      assert.strictEqual(typeof data, 'object')
      assert.strictEqual(data.id, 'mydoc')
      assert.strictEqual(typeof data.rev, 'string')
      assert.strictEqual(data.ok, true)
    }).catch(function (e) {
      // shouldn't get here
      assert(false)
    })
  })
})
