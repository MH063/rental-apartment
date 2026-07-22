const { request } = require('../../utils/request')

Page({
  data: { loading: false },
  async onLogin() {
    this.setData({ loading: true })
    try {
      const { code } = await wx.login()
      if (!code) return wx.showToast({ title: '登录失败', icon: 'none' })
      const res = await request({ url: '/api/auth/login', method: 'POST', data: { code } })
      wx.setStorageSync('token', res.access_token)
      wx.setStorageSync('refresh_token', res.refresh_token)
      getApp().globalData.token = res.access_token
      wx.redirectTo({ url: '/pages/index/index' })
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
