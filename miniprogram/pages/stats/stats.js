const { request } = require('../../utils/request')

Page({
  data: { trend: [], category: [], yearly: [] },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })
    try {
      const [trend, category, yearly] = await Promise.all([
        request({ url: `/api/houses/${houseId}/stats/trend` }),
        request({ url: `/api/houses/${houseId}/stats/category` }),
        request({ url: `/api/houses/${houseId}/stats/yearly` }),
      ])
      this.setData({ trend: trend || [], category: category || [], yearly: yearly || [] })
    } catch (e) {
      // silent
    }
  },
})
