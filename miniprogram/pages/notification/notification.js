const { request } = require('../../utils/request')

Page({
  data: { notifications: [] },
  onShow() {
    this.load()
  },
  async load() {
    const notifications = await request({ url: `/api/notifications` })
    this.setData({ notifications })
  },
  async onRead() {
    await request({ url: `/api/notifications/read`, method: 'POST' })
    wx.showToast({ title: '已全部已读' })
  },
})
