const { request } = require('../../utils/request')

Page({
  data: {
    trend: null,
    category: null,
    yearly: null,
  },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const [trend, category, yearly] = await Promise.all([
      request({ url: `/api/houses/${houseId}/stats/trend` }),
      request({ url: `/api/houses/${houseId}/stats/category` }),
      request({ url: `/api/houses/${houseId}/stats/yearly` }),
    ])
    this.setData({ trend, category, yearly })
  },
})
