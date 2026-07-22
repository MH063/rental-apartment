const { request } = require('../../utils/request')

Page({
  data: { loading: false },
  async onCreate() {
    this.setData({ loading: true })
    try {
      const houseId = getApp().globalData.currentHouseId
      if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })
      const res = await request({ url: `/api/houses/${houseId}/settlements`, method: 'POST' })
      wx.showToast({ title: '结算已生成' })
      wx.navigateTo({ url: `/pages/settlement/detail/detail?id=${res.id}` })
    } catch (e) {
      wx.showToast({ title: e.error || '生成失败，可能没有待结算账单', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
