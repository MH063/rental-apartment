const { request } = require('../utils/request')

async function getTrend(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/trend` })
}

async function getCategory(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/category` })
}

async function getYearly(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/yearly` })
}

module.exports = { getTrend, getCategory, getYearly }
