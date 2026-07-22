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

async function getInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite` })
}

async function renewInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite/renew`, method: 'POST' })
}

module.exports = { createHouse, getHouse, updateHouse, deleteHouse, getInviteCode, renewInviteCode }
