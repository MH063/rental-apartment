const { request } = require('../../utils/request')

Page({
  data: { title: '', totalAmount: '', categoryId: 0, splitType: '均摊', categories: [], members: [], billDate: new Date().toISOString().slice(0,10), splits: [], receiptUrl: '' },
  onShow() {
    this.loadOptions()
  },
  async loadOptions() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })

    const [categories, members] = await Promise.all([
      request({ url: `/api/houses/${houseId}/categories` }),
      request({ url: `/api/houses/${houseId}/members` }),
    ])
    this.setData({
      categories,
      members: members.map(m => ({ ...m, weight: 1, days: 30, usage: 0, area: 1 })),
    })
  },
  onCategoryChange(e) {
    this.setData({ categoryId: Number(e.detail.value) })
  },
  onSplitTypeChange(e) {
    this.setData({ splitType: e.detail.value === '0' ? '均摊' : ['均摊','权重','天数','用量','面积','阶梯'][e.detail.value] })
  },
  onSplitChange(e) {
    const { field, idx } = e.currentTarget.dataset
    const { members, splitType } = this.data
    const val = Number(e.detail.value)
    if (['权重','天数','用量','面积','阶梯'].includes(splitType)) {
      members[idx][field] = isNaN(val) ? 0 : val
      this.setData({ members })
    }
  },
  async onSubmit() {
    const { title, totalAmount, categoryId, splitType, billDate, members } = this.data
    if (!title || !totalAmount) return wx.showToast({ title: '请填写完整信息', icon: 'none' })

    const houseId = getApp().globalData.currentHouseId
    const total = Math.round(Number(totalAmount) * 100)

    // Build splits from members
    const splits = members.map(m => {
      let amount = 0
      const cnt = members.length
      const totalWeight = members.reduce((s, mm) => s + (mm.weight || 1), 0)
      const totalDays = members.reduce((s, mm) => s + (mm.days || 30), 0)
      const totalUsage = members.reduce((s, mm) => s + (mm.usage || 0), 0)
      const totalArea = members.reduce((s, mm) => s + (mm.area || 1), 0)

      switch (splitType) {
        case '均摊': amount = Math.round(total / cnt); break
        case '权重': amount = Math.round(total * (m.weight || 1) / totalWeight); break
        case '天数': amount = Math.round(total * (m.days || 30) / totalDays); break
        case '用量': amount = Math.round(total * (m.usage || 0) / totalUsage); break
        case '面积': amount = Math.round(total * (m.area || 1) / totalArea); break
        case '阶梯': amount = Math.round(total / cnt); break
      }
      return { user_id: m.user_id, amount }
    })

    await request({
      url: `/api/houses/${houseId}/bills`,
      method: 'POST',
      data: { title, total_amount: total, category_id: categoryId || undefined, split_type: splitType, bill_date: billDate, splits }
    })
    wx.showToast({ title: '创建成功' })
    wx.navigateBack()
  },
})
