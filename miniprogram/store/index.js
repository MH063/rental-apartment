const { authStore, login, loadProfile, logout } = require('./auth')
const { houseStore, loadHouses, loadMembers, loadCategories, switchHouse } = require('./house')
const { billStore, loadBills, loadBillSummary, setBillFilter } = require('./bill')
const { settlementStore, loadSettlements, loadSettlementDetail, createSettlement, loadStats, loadRanking } = require('./settlement')

async function init() {
  const token = wx.getStorageSync('token') || ''
  authStore.setState({ token })
  if (token) {
    try {
      await loadHouses()
      await loadProfile()
    } catch { /* will redirect on 401 */ }
  }
}

module.exports = {
  authStore, login, loadProfile, logout,
  houseStore, loadHouses, loadMembers, loadCategories, switchHouse,
  billStore, loadBills, loadBillSummary, setBillFilter,
  settlementStore, loadSettlements, loadSettlementDetail, createSettlement, loadStats, loadRanking,
  init,
}
