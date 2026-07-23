const { init } = require('./store/index')

App({
  globalData: { token: '', currentHouseId: null, userInfo: null },
  onLaunch() {
    const token = wx.getStorageSync('token') || ''
    this.globalData.token = token
    // 从 storage 恢复上次选择的房屋 ID，避免重启后丢失
    const savedHouseId = wx.getStorageSync('currentHouseId')
    if (savedHouseId) this.globalData.currentHouseId = savedHouseId
    init()
  },
})
