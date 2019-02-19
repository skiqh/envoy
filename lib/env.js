// helper function to find credentials from environment variables
const getCredentials = (startOpts) => {
  if (!startOpts) {
    startOpts = {}
  }
  const production = (process.env.PRODUCTION === 'true')
  const opts = {
    couchHost: process.env.COUCH_HOST || startOpts.couchHost || null,
    databaseName: process.env.ENVOY_DATABASE_NAME || startOpts.databaseName || 'envoy',
    usersDatabaseName: process.env.ENVOY_USERS_DATABASE_NAME || startOpts.usersDatabaseName || 'envoyusers',
    logFormat: process.env.LOG_FORMAT || startOpts.logFormat || 'off',
    port: process.env.PORT || startOpts.port || null,
    url: null,
    production: production || startOpts.production || false,
    static: process.env.ENVOY_STATIC || startOpts.static || null,
    router: startOpts.router || null,
    middleware: startOpts.middleware || []
  }

  if (process.env.VCAP_SERVICES) {
    // this will throw an exception if VCAP_SERVICES is not valid JSON
    const services = JSON.parse(process.env.VCAP_SERVICES)

    // extract Cloudant credentials from VCAP_SERVICES
    if (!opts.couchHost &&
        Array.isArray(services.cloudantNoSQLDB) &&
        services.cloudantNoSQLDB.length > 0 &&
        typeof services.cloudantNoSQLDB[0].credentials === 'object') {
      const bluemixOpts = services.cloudantNoSQLDB[0].credentials
      opts.couchHost = 'https://' +
        encodeURIComponent(bluemixOpts.username) + ':' +
        encodeURIComponent(bluemixOpts.password) + '@' +
        encodeURIComponent(bluemixOpts.username) + '.cloudant.com'
    }

    // bluemix/cloudfoundry config
    const cfenv = require('cfenv')
    const appEnv = cfenv.getAppEnv()
    opts.port = appEnv.port
    opts.url = appEnv.url
  }

  // piecemeal environment variables
  if (!opts.url) {
    opts.url = 'localhost:' + (opts.port || '0')
  }
  if (!opts.couchHost) {
    throw (new Error('Missing env variable - must supply COUCH_HOST'))
  }

  return opts
}

module.exports = {
  getCredentials: getCredentials
}
