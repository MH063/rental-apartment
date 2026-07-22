const { init } = require('./store/index')

App({
  globalData: { token: '', currentHouseId: null, userInfo: null },
  onLaunch() {
    const token = wx.getStorageSync('token') || ''
    this.globalData.token = token
    init()
  },
})
