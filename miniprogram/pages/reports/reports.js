const { request } = require('../../utils/request')

Page({
  data: { reports: [], startDate: '', endDate: '' },
  onShow() {
    const d = new Date()
    const end = d.toISOString().slice(0,10)
    d.setMonth(d.getMonth() - 3)
    const start = d.toISOString().slice(0,10)
    this.setData({ startDate: start, endDate: end })
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const reports = await request({ url: `/api/houses/${houseId}/reports`, data: { start_date: this.data.startDate, end_date: this.data.endDate } })
    this.setData({ reports })
  },
  onDateChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value }, () => this.load())
  },
})
