Page({
  onLoad() {
    wx.scanCode({
      success(res) {
        const inviteCode = res.result
        wx.navigateTo({ url: `/pages/house/join/join?code=${inviteCode}` })
      },
    })
  },
  onShow() {
    wx.scanCode({
      success(res) {
        const inviteCode = res.result
        wx.navigateTo({ url: `/pages/house/join/join?code=${inviteCode}` })
      },
    })
  },
})
