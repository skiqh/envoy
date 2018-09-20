/* eslint-env mocha */
'use strict'
/* globals testUtils */

var assert = require('assert')

var PouchDB = require('pouchdb')

var request = require('request')

var remoteURL = null

var remote = null

describe('query', function () {
  before(function () {
    return testUtils.createUser().then(function (url) {
      remote = new PouchDB(url)
      remoteURL = url
      var docs = testUtils.makeDocs(20)
      return remote.bulkDocs(docs)
    })
  })

  it('select records without an index', function (done) {
    // Cloudant "/db/_find"
    var r = {
      url: remoteURL + '/' + '_find',
      method: 'post',
      body: {
        selector: {
          i: { $gt: 5 }
        }
      },
      json: true
    }
    request(r, function (err, res, response) {
      assert(err == null)
      assert(typeof response.warning === 'string')
      assert(response.docs.length > 1)
      response.docs.forEach(function (doc) {
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5)
      })
      done()
    })
  })

  // POST /db/_index not support so should 404
  it('fail to create json index', function (done) {
    // Cloudant "/db/_index"
    // create json index
    var r = {
      url: remoteURL + '/' + '_index',
      method: 'post',
      body: {
        index: {
          fields: ['i']
        },
        name: 'testjsonindex',
        type: 'json'
      },
      json: true
    }
    request(r, function (err, res, response) {
      assert.strictEqual(err, null)
      assert.strictEqual(res.statusCode, 404)
      done()
    })
  })

  /* Removed index creation tests - see issue #31

  it('create json index', function(done) {
    // Cloudant "/db/_index"
    // create json index
    var r = {
      url: '_index',
      method: 'post',
      body: {
        index: {
          fields: ['i']
        },
        name: 'testjsonindex',
        type: 'json'
      }
    };
    remote.request(r, function(err, response) {
      assert(err == null);
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testjsonindex');
      done();
    });

  });

  it('read from json index', function (done) {
    // perform search
    var r = {
      url: '_find',
      method: 'post',
      body: {
        selector: {
          i: { $gt: 5}
        }
      }
    };
    remote.request(r, function (err, response) {
      assert(err == null);
      // this is commented out but shouldn't be
      // see https://github.com/cloudant-labs/envoy/issues/7
//      assert(typeof response.warning != 'string')
      assert(response.docs.length > 1);
      response.docs.forEach(function (doc) {
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5);

        // ensure we have stripped auth information
        assert(typeof doc[app.metaKey] === 'undefined');
      });
      done();
    });
  });

  it('create text index', function (done) {
    // Cloudant "/db/_find"
    // create json index
    var r = {
      url: '_index',
      method: 'post',
      body: {
        index: {
          fields: [{name: 'i', type: 'number'}]
        },
        name: 'testtextindex',
        type: 'text'
      }
    };
    remote.request(r, function(err, response) {
      assert(err == null);
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testtextindex');
      done();
    });

  });

  it('read from text index', function (done) {
    // perform search
    var r = {
      url: '_find',
      method: 'post',
      body: {
        selector: {
          i: { $gt: 5}
        }
      }
    };
    remote.request(r, function (err, response) {
      assert(err == null);
      assert(typeof response.warning !== 'string');
      assert(response.docs.length > 1);
      response.docs.forEach(function (doc) {
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5);

        // ensure we have stripped auth information
        assert(typeof doc[app.metaKey] === 'undefined');
      });
      done();
    });
  });
*/
})
