const { request } = require('../utils/request')

async function createHouse(data) {
  return request({ url: '/api/houses', method: 'POST', data })
}

async function getHouse(id) {
  return request({ url: `/api/houses/${id}` })
}

async function updateHouse(id, data) {
  return request({ url: `/api/houses/${id}`, method: 'PUT', data })
}

async function deleteHouse(id) {
  return request({ url: `/api/houses/${id}`, method: 'DELETE' })
}

/**
 * 获取邀请码
 * 后端路由：GET /api/houses/:id/invite-code
 */
async function getInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite-code` })
}

/**
 * 重新生成邀请码
 * 后端路由：POST /api/houses/:id/invite-code/renew
 */
async function renewInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite-code/renew`, method: 'POST' })
}

module.exports = { createHouse, getHouse, updateHouse, deleteHouse, getInviteCode, renewInviteCode }
