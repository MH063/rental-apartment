const { request } = require('../../utils/request')

Page({
  data: {
    user: null,
    paymentMethods: [],
  },
  onShow() {
    this.load()
  },
  async load() {
    const user = getApp().globalData.userInfo
    const paymentMethods = await request({ url: '/api/payment-methods' })
    this.setData({ user, paymentMethods })
  },
  onLogout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('refresh_token')
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
