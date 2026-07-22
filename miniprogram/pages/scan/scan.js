Page({
  data: { scanning: false },
  onShow() {
    this.doScan()
  },
  doScan() {
    if (this.data.scanning) return
    this.setData({ scanning: true })
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        const code = res.result
        if (/^\d{6}$/.test(code)) {
          wx.navigateTo({ url: `/pages/house/join/join?code=${code}` })
        } else {
          wx.showToast({ title: '无效的邀请码', icon: 'none' })
          wx.navigateTo({ url: '/pages/house/join/join' })
        }
      },
      fail() {
        wx.navigateTo({ url: '/pages/house/join/join' })
      },
      complete: () => {
        this.setData({ scanning: false })
      }
    })
  },
})
