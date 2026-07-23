const { createStore } = require('./store')
const { request } = require('../utils/request')

const settlementStore = createStore({
  settlements: [],
  currentSettlement: null,
  stats: { trend: [], category: [], yearly: [] },
  ranking: [],
})

async function loadSettlements() {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return
  const settlements = await request({ url: '/api/settlements', data: { house_id: houseId } })
  settlementStore.setState({ settlements })
}

async function loadSettlementDetail(id) {
  const settlement = await request({ url: `/api/settlements/${id}` })
  settlementStore.setState({ currentSettlement: settlement })
}

async function createSettlement(houseId, startDate, endDate) {
  const res = await request({
    url: '/api/settlements',
    method: 'POST',
    data: { house_id: houseId, start_date: startDate, end_date: endDate },
  })
  return res
}

async function loadStats() {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return
  const [trend, category, yearly] = await Promise.all([
    request({ url: `/api/houses/${houseId}/stats/trend` }),
    request({ url: `/api/houses/${houseId}/stats/category` }),
    request({ url: `/api/houses/${houseId}/stats/yearly` }),
  ])
  settlementStore.setState({ stats: { trend: trend || [], category: category || [], yearly: yearly || [] } })
}

async function loadRanking(startDate, endDate) {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return
  const params = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  const ranking = await request({ url: `/api/houses/${houseId}/ranking`, data: params })
  settlementStore.setState({ ranking })
}

module.exports = { settlementStore, loadSettlements, loadSettlementDetail, createSettlement, loadStats, loadRanking }
