const { request } = require('../utils/request')

async function createChallenge(settlementId, itemId, data) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/challenges`, method: 'POST', data })
}

async function respondChallenge(id, data) {
  return request({ url: `/api/challenges/${id}/respond`, method: 'POST', data })
}

async function acceptChallenge(id) {
  return request({ url: `/api/challenges/${id}/accept`, method: 'POST' })
}

async function rulingChallenge(id, data) {
  return request({ url: `/api/challenges/${id}/ruling`, method: 'POST', data })
}

module.exports = { createChallenge, respondChallenge, acceptChallenge, rulingChallenge }
