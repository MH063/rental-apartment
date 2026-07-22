const { request } = require('../../../utils/request')

Page({
  data: { title: '', totalAmount: '', categoryId: 0, splitType: '均摊', categories: [], members: [], billDate: new Date().toISOString().slice(0,10), splits: [], receiptUrl: '', selectedCategoryName: '选择分类' },
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
      selectedCategoryName: categories[0]?.name || '选择分类',
    })
  },
  onCategoryChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ categoryId: idx, selectedCategoryName: this.data.categories[idx]?.name || '选择分类' })
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
    if (!title || !totalAmount) return wx.showToast({ title: '请填写完整信�?, icon: 'none' })

    const houseId = getApp().globalData.currentHouseId
    const total = Math.round(Number(totalAmount) * 100)

    // Build splits �?send parameters, not pre-computed amounts (server computes)
    const splits = members.map(m => {
      let parameter = 1
      if (splitType === '权重') parameter = m.weight || 1
      else if (splitType === '天数') parameter = m.days || 30
      else if (splitType === '用量') parameter = m.usage || 0
      else if (splitType === '面积') parameter = m.area || 1
      return { user_id: m.user_id, parameter }
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
