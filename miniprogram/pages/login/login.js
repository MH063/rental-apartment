Page({
  onLoad() {
    wx.login({
      success(res) {
    if (res.code) {
      wx.request({
        url: 'http://localhost:8787/api/auth/login',
            method: 'POST',
            data: { code: res.code },
            success(r) {
              if (r.data.success) {
                wx.setStorageSync('token', r.data.data.access_token)
                wx.setStorageSync('refresh_token', r.data.data.refresh_token)
                wx.redirectTo({ url: '/pages/index/index' })
              }
            },
          })
        }
      },
    })
  },
})
