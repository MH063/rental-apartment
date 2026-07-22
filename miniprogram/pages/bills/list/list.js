const { request } = require('../../utils/request')

Page({
  data: {
    bills: [],
    filters: { status: '', categoryId: '', keyword: '' },
  },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    const bills = await request({ url: `/api/houses/${houseId}/bills` })
    this.setData({ bills })
  },
})
