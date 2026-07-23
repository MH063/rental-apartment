const { request } = require('../../utils/request')

Page({
  data: { notifications: [], loading: false, loaded: false },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const notifications = await request({ url: '/api/notifications' })
      const list = notifications || []
      var count = 0
      for (var i = 0; i < list.length; i++) { if (!list[i].read) count++ }
      this.setData({ notifications: list, unreadCount: count, loaded: true, loading: false })
    } catch {
      this.setData({ loading: false, loaded: true })
    }
  },

  onTap(e) {
    const item = e.currentTarget.dataset.item
    if (!item.read) {
      this.markRead(item.id, e.currentTarget.dataset.index)
    }
  },

  async markRead(id, index) {
    try {
      await request({ url: '/api/notifications/read', method: 'POST', data: { id } })
      const key = 'notifications[' + index + '].read'
      this.setData({ [key]: true })
    } catch {
      // silent
    }
  },

  async onReadAll() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      await request({ url: '/api/notifications/read', method: 'POST', data: {} })
      var items = this.data.notifications
      for (var i = 0; i < items.length; i++) { items[i].read = true }
      this.setData({ notifications: items, unreadCount: 0, loading: false })
      wx.showToast({ title: '已全部已读', icon: 'success' })
    } catch {
      this.setData({ loading: false })
    }
  },
})
