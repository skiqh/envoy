console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
module.exports = (opts) => {
  const express = require('express')
  const app = module.exports = express()
  const compression = require('compression')
  const session = require('express-session')
  const Nano = require('nano')
  const bodyParser = require('body-parser')
  const async = require('async')
  const init = require('./lib/init')
  const events = require('events')
  const ee = new events.EventEmitter()
  const auth = require('./lib/auth')
  const morgan = require('morgan')
  const cors = require('./lib/cors')
  const path = require('path')
  app.opts = require('./lib/env').getCredentials(opts)
  const nano = Nano(app.opts.couchHost)
  const dbName = app.dbName = app.opts.databaseName

  // app meta data
  app.db = nano.db.use(dbName)
  app.usersdb = nano.db.use('_users')
  app.metaKey = 'com_cloudant_meta'
  app.events = ee
  app.cloudant = nano
  app.serverURL = app.opts.couchHost
  app.auth = auth
  app.spoolChangesProgress = 0

  // Setup the logging format
  if (app.opts.logFormat !== 'off') {
    app.use(morgan(app.opts.logFormat))
  }

  const main = () => {
    // Load custom middleware
    if (app.opts.middleware.length) {
      console.log('[OK]  Loading middleware')
      app.opts.middleware.forEach((m) => {
        app.use(m)
      })
    }

    const production = (app.opts.production && app.opts.production === 'true')
    if (app.opts.static) {
      console.log('[OK]  Serving out directory: ' + app.opts.static)
      app.use('/', express.static(app.opts.static))
    } else if (!production) {
      // setup static public directory
      app.use(express.static(path.join(__dirname, 'public')))
    }

    // enable cors
    app.use(cors())

    // gzip responses
    app.use(compression())
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))

    // session support
    if (opts && opts.sessionHandler) {
      app.use(opts.sessionHandler)
    } else {
      console.log('[OK]  Using default session handler')
      app.use(session({
        secret: app.metaKey,
        resave: true,
        saveUninitialized: true
      }))
    }

    // plug in custom routes
    if (app.opts.router) {
      app.use(app.opts.router)
    }

    // load the routes
    const router = require('./lib/routes/index')
    app.use('/', router)

    // Catch unknown paths
    app.use((req, res, next) => {
      res.status(400).send({ error: 'bad_request', reason: 'unknown path' })
    })

    // Error handlers
    app.use((err, req, res, next) => {
      console.error(err.stack)
      res.status(500).send({ error: 'internal_server_error', reason: 'server error' })
    })

    // if provided, start the express app on the given port
    if(app.opts.port) {
      app.listen(app.opts.port)
    }
  }

  // Make sure that any init stuff is executed before
  // kicking off the app.
  async.series(
    [
      init.verifyDB,
      init.verifyBulkGet,
      init.verifySecurityDoc,
      auth.init,
      init.setupChangesDB,
      init.spoolChanges
    ],

    (err, results) => {
      for (let result in results) {
        if (results[result]) {
          console.log(results[result])
        }
      }

      if (err != null) {
        process.exit(1)
      }

      main()

      console.log('[OK]  main: Started app on', app.opts.url)
    }
  )

  return app
}
