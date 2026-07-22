const { authStore, loadProfile, logout } = require('../../store/index')
const { houseStore, loadHouses, switchHouse } = require('../../store/index')

Page({
  data: {},
  onShow() {
    authStore.connect(this, 'auth')
    houseStore.connect(this, 'house')
    this.load()
  },
  async load() {
    await Promise.all([loadProfile(), loadHouses()])
  },
  onSwitchHouse(e) {
    switchHouse(e.currentTarget.dataset.id)
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
      },
    })
  },
})
