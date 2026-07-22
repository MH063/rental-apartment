const { request } = require('../utils/request')

async function listMembers(houseId) {
  return request({ url: `/api/houses/${houseId}/members` })
}

async function changeRole(houseId, userId, role) {
  return request({ url: `/api/houses/${houseId}/members/${userId}/role`, method: 'PUT', data: { role } })
}

async function removeMember(houseId, userId) {
  return request({ url: `/api/houses/${houseId}/members/${userId}`, method: 'DELETE' })
}

async function joinHouse(code) {
  return request({ url: '/api/houses/join', method: 'POST', data: { code } })
}

async function leaveHouse(houseId) {
  return request({ url: `/api/houses/${houseId}/members/me`, method: 'DELETE' })
}

module.exports = { listMembers, changeRole, removeMember, joinHouse, leaveHouse }
