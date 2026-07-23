const { authStore, loadProfile, logout } = require('../../store/index')
const { houseStore, loadHouses, switchHouse } = require('../../store/index')

Page({
  data: {},
  onShow() {
    authStore.connect(this, 'auth')
    houseStore.connect(this, 'house')
    this.load()
  },
  /**
   * 加载用户信息和房屋列表
   */
  async load() {
    try {
      await Promise.all([loadProfile(), loadHouses()])
    } catch (e) {
      console.error('[profile] 加载失败:', e)
    }
  },
  /**
   * 切换当前房屋
   */
  onSwitchHouse(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.house.currentHouseId) return
    switchHouse(id)
    wx.showToast({ title: '已切换房屋', icon: 'success' })
  },
  /**
   * 退出登录（二次确认）
   */
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出吗？退出后需重新登录。',
      confirmColor: '#ef4444',
      success(res) {
        if (res.confirm) {
          logout()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      },
    })
  },
})
