const { request } = require('../../utils/request')

Page({
  data: { code: '', inviteInfo: null, loading: false },
  onLoad(opts) {
    if (opts.code) this.setData({ code: opts.code })
  },
  async onLookup() {
    this.setData({ loading: true })
    try {
      const res = await request({ url: `/api/houses/join`, method: 'POST', data: { invite_code: this.data.code } })
      getApp().globalData.currentHouseId = res.house_id
      wx.showToast({ title: '加入成功' })
      wx.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      wx.showToast({ title: e.error || '无效的邀请码', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
