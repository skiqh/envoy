/* eslint-env mocha */
'use strict'

var access = require('../lib/access.js')

var assert = require('assert')

describe('misc utils tests', function () {
  it('add/remove owner to id for normal doc', function (done) {
    var id = '938f5320-0fb3-5354-8ffc-09394a9737d6'
    var ownerid = 'mbaas1465913235414user0'
    var newid = access.addOwnerId(id, ownerid)
    assert(id !== newid)
    var original = access.removeOwnerId(newid)
    assert.strictEqual(original, id)
    done()
  })

  it('add/remove owner to id for _local doc', function (done) {
    var id = '_local/abc123'
    var ownerid = 'rita'
    var newid = access.addOwnerId(id, ownerid)
    assert(id !== newid)
    var original = access.removeOwnerId(newid)
    assert.strictEqual(original, id)
    done()
  })

  it('check ownership by valid ids', function (done) {
    var ownerid = 'rita'
    var ids = ['a', '9770da92-7165-4026-ae09-02dd8984ed86',
      '9770da9271654026ae0902dd8984ed86', '_local/a']
    ids.forEach(function (id) {
      var newId = access.addOwnerId(id, ownerid)
      var mine = access.myId(newId, ownerid)
      assert.strictEqual(mine, true, 'id: ' + newId + ', owner:' + ownerid)
    })
    done()
  })

  it('check ownership of invalid ids', function (done) {
    var ownerid = 'rita'
    var ids = ['bob-a', '9770da92-7165-4026-ae09-02dd8984ed86', 'sue-9770da9271654026ae0902dd8984ed86']
    ids.forEach(function (id) {
      var mine = access.myId(id, ownerid)
      assert.strictEqual(mine, false)
    })
    done()
  })

  it('check ownership of documents', function (done) {
    var ownerid1 = 'rita'
    var ownerid2 = 'sue'
    var docs = [
      { _id: 'a', _rev: '1-123', a: 1, b: 2 },
      { _id: '123', _rev: '1-123', a: 1, b: 2 }
    ]
    var docs2 = [
      { _id: 'a', _rev: '1-123', a: 1, b: 2 },
      { _id: '123', _rev: '1-123', a: 1, b: 2 }
    ]
    for (var i in docs) {
      docs[i]._id = access.addOwnerId(docs[i]._id, ownerid1)
    }
    for (var j in docs2) {
      docs2[j]._id = access.addOwnerId(docs2[j]._id, ownerid2)
    }
    docs.forEach(function (doc) {
      assert.strictEqual(access.isMine(doc, ownerid1), true)
      assert.strictEqual(access.isMine(doc, ownerid2), false)
    })
    docs2.forEach(function (doc) {
      assert.strictEqual(access.isMine(doc, ownerid1), false)
      assert.strictEqual(access.isMine(doc, ownerid2), true)
    })
    done()
  })

  it('strip doc', function (done) {
    var doc = { _id: access.addOwnerId('123', 'bob'), _rev: '1-123', a: 1, b: 2 }
    var doc2 = { _id: access.addOwnerId('_local/abc', 'bob'), _rev: '1-123', a: 1, b: 2 }
    var stripped = access.strip(doc)
    var stripped2 = access.strip(doc2)
    assert.strictEqual('123', stripped._id)
    assert.strictEqual('_local/abc', stripped2._id)
    done()
  })

  it('add auth doc', function (done) {
    var id = 'dog'
    var doc = { _id: id, a: 1 }
    var ownerid = 'bob'
    var newdoc = access.addAuth(doc, ownerid)
    assert(id !== newdoc._id)
    assert.strictEqual(newdoc.a, 1)
    var stripped = access.strip(newdoc)
    assert.strictEqual('dog', stripped._id)
    done()
  })
})
