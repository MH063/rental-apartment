const { request } = require('../../utils/request')

Page({
  data: {
    summary: null,
    unpaidCount: 0,
    house: null,
    nickname: '',
  },
  onShow() {
    this.load()
  },
  async load() {
    const app = getApp()
    const houseId = app.globalData.currentHouseId
    if (!houseId) {
      const houses = await request({ url: '/api/houses' })
      if (houses?.length > 0) {
        app.globalData.currentHouseId = houses[0].id
        this.setData({ house: houses[0] })
      }
    }
    const hid = app.globalData.currentHouseId
    if (!hid) return

    try {
      const [summary, unpaid, house] = await Promise.all([
        request({ url: `/api/houses/${hid}/stats/trend` }),
        request({ url: `/api/houses/${hid}/bills`, data: { status: '待支付' } }),
        request({ url: `/api/houses/${hid}` }),
      ])
      this.setData({ summary, unpaidCount: unpaid?.length || 0, house })
    } catch (e) {
      // silent
    }
  },
})
