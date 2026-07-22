const { createChallenge, respondChallenge } = require('../../../services/challenge')

Page({
  data: { settlementId: null, itemId: null, reason: '', amount: '' },
  onLoad(opts) {
    this.setData({ settlementId: opts.id, itemId: opts.itemId })
  },
  async onSubmit() {
    if (!this.data.reason) return wx.showToast({ title: '请输入质疑原�?, icon: 'none' })
    await createChallenge(this.data.settlementId, this.data.itemId, {
      reason: this.data.reason,
      amount: this.data.amount ? Math.round(parseFloat(this.data.amount) * 100) : undefined,
    })
    wx.showToast({ title: '已提交质�? })
    setTimeout(() => wx.navigateBack(), 1500)
  },
})
