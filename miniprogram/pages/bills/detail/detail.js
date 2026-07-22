const { request } = require('../../utils/request')

Page({
  data: { bill: null, splits: [], settlementItems: [] },
  onLoad(opts) {
    this.setData({ billId: opts.id })
    this.load()
  },
  async load() {
    if (!this.data.billId) return
    const bill = await request({ url: `/api/bills/${this.data.billId}` })
    this.setData({ bill })
  },
  async onConfirm() {
    const houseId = getApp().globalData.currentHouseId
    await request({ url: `/api/houses/${houseId}/bills/${this.data.billId}/confirm`, method: 'POST' })
    wx.showToast({ title: '已确认' })
    this.load()
  },
})
