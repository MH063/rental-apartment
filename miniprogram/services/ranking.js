const { request } = require('../utils/request')

async function getRanking(houseId, params) {
  return request({ url: `/api/houses/${houseId}/ranking`, data: params })
}

module.exports = { getRanking }
