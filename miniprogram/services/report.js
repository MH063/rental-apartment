const { request } = require('../utils/request')

async function getReports(houseId, params) {
  return request({ url: `/api/houses/${houseId}/reports`, data: params })
}

module.exports = { getReports }
