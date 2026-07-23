const { request } = require('../../../utils/request')

Page({
  data: { bills: [], hasHouse: false, loading: true, error: '' },

  onShow() {
    this.load()
  },

  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) {
      this.setData({ hasHouse: false, loading: false })
      return
    }
    this.setData({ hasHouse: true, loading: true, error: '' })
    try {
      const bills = await request({ url: '/api/bills/my', data: { house_id: houseId } })
      this.setData({ bills: bills || [], loading: false })
    } catch {
      this.setData({ loading: false, error: '加载失败，请重试' })
    }
  },

  onTap(e) {
    wx.navigateTo({ url: '/pages/bills/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/bills/create/create' })
  },
})
