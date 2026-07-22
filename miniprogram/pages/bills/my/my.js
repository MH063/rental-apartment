const { request } = require('../../../utils/request')

Page({
  data: { bills: [] },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const bills = await request({ url: `/api/bills/my?house_id=${houseId}` })
    this.setData({ bills })
  },
})
