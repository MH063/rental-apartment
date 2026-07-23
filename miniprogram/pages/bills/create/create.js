const { request } = require('../../../utils/request')

Page({
  data: {
    title: '',
    totalAmount: '',
    categoryId: 0,
    splitType: '均摊',
    categories: [],
    members: [],
    selectedMemberIds: [],
    billDate: new Date().toISOString().slice(0, 10),
    selectedCategoryName: '选择分类',
  },
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
    const firstCategory = categories[0]
    // 默认全选所有成员参与分摊
    const allMemberIds = members.map(m => m.user_id)
    this.setData({
      categories,
      categoryId: firstCategory?.id || 0,
      members: members.map(m => ({ ...m, weight: 1, days: 30, usage: 0, area: 1 })),
      selectedMemberIds: allMemberIds,
      selectedCategoryName: firstCategory?.name || '选择分类',
    })
  },
  /**
   * 点击分类网格选中分类
   */
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    const selected = this.data.categories.find(c => c.id === id)
    this.setData({ categoryId: id, selectedCategoryName: selected?.name || '选择分类' })
  },
  onSplitTypeChange(e) {
    this.setData({ splitType: e.detail.value === '0' ? '均摊' : ['均摊', '权重', '天数', '用量', '面积', '阶梯'][e.detail.value] })
  },
  /**
   * 切换成员选中状态（勾选/取消参与分摊）
   */
  onToggleMember(e) {
    const userId = e.currentTarget.dataset.userId
    let { selectedMemberIds } = this.data
    if (selectedMemberIds.includes(userId)) {
      selectedMemberIds = selectedMemberIds.filter(id => id !== userId)
    } else {
      selectedMemberIds = [...selectedMemberIds, userId]
    }
    this.setData({ selectedMemberIds })
  },
  /**
   * 全选/取消全选成员
   */
  onToggleAll() {
    const { members, selectedMemberIds } = this.data
    if (selectedMemberIds.length === members.length) {
      this.setData({ selectedMemberIds: [] })
    } else {
      this.setData({ selectedMemberIds: members.map(m => m.user_id) })
    }
  },
  onSplitChange(e) {
    const { field, idx } = e.currentTarget.dataset
    const { members, splitType } = this.data
    const val = Number(e.detail.value)
    if (['权重', '天数', '用量', '面积', '阶梯'].includes(splitType)) {
      members[idx][field] = isNaN(val) ? 0 : val
      this.setData({ members })
    }
  },
  async onSubmit() {
    const { title, totalAmount, categoryId, splitType, billDate, members, selectedMemberIds } = this.data
    if (!title || !totalAmount) return wx.showToast({ title: '请填写完整信息', icon: 'none' })
    if (selectedMemberIds.length === 0) return wx.showToast({ title: '请至少选择一名成员', icon: 'none' })

    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })
    const total = Math.round(Number(totalAmount) * 100)

    // 仅提交被选中的成员参与分摊
    const selectedMembers = members.filter(m => selectedMemberIds.includes(m.user_id))
    const splits = selectedMembers.map(m => {
      let parameter = 1
      if (splitType === '权重') parameter = m.weight || 1
      else if (splitType === '天数') parameter = m.days || 30
      else if (splitType === '用量') parameter = m.usage || 0
      else if (splitType === '面积') parameter = m.area || 1
      return { user_id: m.user_id, parameter }
    })

    await request({
      url: '/api/bills',
      method: 'POST',
      data: { house_id: houseId, title, total_amount: total, category_id: categoryId || undefined, split_type: splitType, bill_date: billDate, splits }
    })
    wx.showToast({ title: '创建成功' })
    wx.navigateBack()
  },
})
