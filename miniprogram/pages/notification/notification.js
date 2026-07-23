const { request } = require('../../utils/request')

Page({
  data: { notifications: [], loading: false },
  onShow() {
    this.load()
  },
  /**
   * 加载通知列表
   */
  async load() {
    try {
      const notifications = await request({ url: '/api/notifications' })
      this.setData({ notifications: notifications || [] })
    } catch (e) {
      console.error('[notification] 加载失败:', e)
    }
  },
  /**
   * 全部标记已读后刷新列表
   */
  async onRead() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      await request({ url: '/api/notifications/read', method: 'POST', data: {} })
      wx.showToast({ title: '已全部已读', icon: 'success' })
      await this.load()
    } catch (e) {
      console.error('[notification] 标记已读失败:', e)
    } finally {
      this.setData({ loading: false })
    }
  },
})
