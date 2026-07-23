const { request } = require('../../../utils/request')

Page({
  data: { settlements: [] },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const settlements = await request({ url: '/api/settlements', data: { house_id: houseId } })
    this.setData({ settlements })
  },
  onTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/settlement/detail/detail?id=${id}` })
  },
})
