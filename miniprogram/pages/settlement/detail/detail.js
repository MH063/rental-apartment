const { request } = require('../../utils/request')

Page({
  data: { settlement: {}, items: [] },
  onLoad(opts) {
    this.setData({ settlementId: opts.id })
    this.load()
  },
  async load() {
    if (!this.data.settlementId) return
    const settlement = await request({ url: `/api/settlements/${this.data.settlementId}` })
    this.setData({ settlement, items: settlement.items || [] })
  },
  async onConfirm() {
    await request({ url: `/api/settlements/${this.data.settlementId}/confirm`, method: 'POST' })
    wx.showToast({ title: '已确认' })
    this.load()
  },
  async onItemConfirm(e) {
    const itemId = e.currentTarget.dataset.id
    await request({ url: `/api/settlements/${this.data.settlementId}/items/${itemId}/confirm`, method: 'POST' })
    wx.showToast({ title: '已确认' })
    this.load()
  },
  async onItemTransfer(e) {
    const itemId = e.currentTarget.dataset.id
    await request({ url: `/api/settlements/${this.data.settlementId}/items/${itemId}/transfer`, method: 'POST' })
    wx.showToast({ title: '已标记转账' })
    this.load()
  },
  onChallenge(e) {
    const itemId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/settlement/challenge/challenge?id=${this.data.settlementId}&itemId=${itemId}` })
  },
})
