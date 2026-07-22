const { login, loadProfile } = require('../../store/index')

Page({
  data: { loading: false },
  async onLogin() {
    this.setData({ loading: true })
    try {
      const { code } = await wx.login()
      if (!code) return wx.showToast({ title: '登录失败', icon: 'none' })
      await login(code)
      await loadProfile()
      wx.redirectTo({ url: '/pages/index/index' })
    } catch (e) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
