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

/**
 * 通过邀请码加入合租屋
 * 后端路由：POST /api/houses/join，body 字段为 invite_code
 */
async function joinHouse(inviteCode) {
  return request({ url: '/api/houses/join', method: 'POST', data: { invite_code: inviteCode } })
}

/**
 * 离开合租屋
 * 后端路由：POST /api/houses/:id/leave
 */
async function leaveHouse(houseId) {
  return request({ url: `/api/houses/${houseId}/leave`, method: 'POST' })
}

module.exports = { listMembers, changeRole, removeMember, joinHouse, leaveHouse }
