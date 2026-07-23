const { request } = require('../../../utils/request')

Page({
  data: {
    loading: false,
    startDate: '',
    endDate: '',
  },
  onLoad() {
    // 默认结算范围为当月第一天到今天
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    this.setData({
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${day}`,
    })
  },
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
  },
  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
  },
  async onCreate() {
    const { startDate, endDate } = this.data
    if (!startDate || !endDate) return wx.showToast({ title: '请选择结算日期范围', icon: 'none' })
    if (startDate > endDate) return wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })

    this.setData({ loading: true })
    try {
      const houseId = getApp().globalData.currentHouseId
      if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })
      const res = await request({
        url: '/api/settlements',
        method: 'POST',
        data: { house_id: houseId, start_date: startDate, end_date: endDate }
      })
      wx.showToast({ title: '结算已生成' })
      wx.navigateTo({ url: `/pages/settlement/detail/detail?id=${res.id}` })
    } catch (e) {
      wx.showToast({ title: (e && e.message) || '生成失败，可能没有待结算账单', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
