const { request } = require('../utils/request')

async function listNotifications() {
  return request({ url: '/api/notifications' })
}

async function markRead() {
  return request({ url: '/api/notifications/read', method: 'POST' })
}

module.exports = { listNotifications, markRead }
