
const app = require('../app')
const access = require('./access.js')
const subscribers = []
const db = app.db

const feed = db.follow({ since: 'now', include_docs: true })
feed.on('change', (change) => {
  for (let i = subscribers.length - 1; i >= 0; i--) {
    const s = subscribers[i]
    if (access.myId(change.id, s.userid)) {
      const c = JSON.parse(JSON.stringify(change))
      c.id = access.removeOwnerId(c.id)
      if (s['include_docs']) {
        c.doc = access.strip(c.doc)
      } else {
        delete c.doc
      }
      if (!s.res.write(JSON.stringify(c) + '\n')) {
        subscribers.splice(i, 1)
      }
    }
  }
})
feed.follow()

const subscribe = (userid, res, includeDocs) => {
  subscribers.push({ userid: userid, res: res, include_docs: includeDocs })
}

module.exports = {
  subscribe: subscribe
}
