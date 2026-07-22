const { request, logout } = require('../../utils/request')

Page({
  data: { user: null, houses: [], currentHouseId: null },
  onShow() {
    this.load()
  },
  async load() {
    const app = getApp()
    const user = app.globalData.userInfo
    const houses = await request({ url: '/api/houses' })
    this.setData({ user, houses, currentHouseId: app.globalData.currentHouseId })
  },
  onSwitchHouse(e) {
    const id = e.currentTarget.dataset.id
    getApp().globalData.currentHouseId = id
    this.setData({ currentHouseId: id })
    wx.showToast({ title: '已切换' })
  },
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      success(res) {
        if (res.confirm) {
          logout()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  },
})
