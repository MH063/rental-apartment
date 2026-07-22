const { houseStore, loadHouses, loadMembers } = require('../../store/index')
const { request } = require('../../utils/request')

Page({
  data: { summary: null, unpaidCount: 0 },
  onShow() {
    houseStore.connect(this, 'house')
    this.load()
  },
  async load() {
    const houses = await loadHouses()
    if (houses?.length) {
      this.loadData()
    }
  },
  async loadData() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    try {
      const [summary, unpaid] = await Promise.all([
        request({ url: `/api/houses/${houseId}/stats/trend` }),
        request({ url: `/api/houses/${houseId}/bills`, data: { status: '待支付' } }),
      ])
      this.setData({ summary, unpaidCount: unpaid?.length || 0 })
    } catch { /* silent */ }
  },
})
