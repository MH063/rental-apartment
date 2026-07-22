App({
  globalData: {
    token: '',
    currentHouseId: null,
    userInfo: null,
  },
  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  },
})
