const { request } = require('../utils/request')

async function listNotifications() {
  return request({ url: '/api/notifications' })
}

// 标记通知已读；显式传入空对象，兼容后端对 body 的解析
async function markRead() {
  return request({ url: '/api/notifications/read', method: 'POST', data: {} })
}

module.exports = { listNotifications, markRead }
