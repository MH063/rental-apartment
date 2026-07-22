const { request } = require('../../utils/request')

Page({
  data: {
    summary: null,
  },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const summary = await request({ url: `/api/houses/${houseId}/stats/trend` })
    this.setData({ summary })
  },
})
