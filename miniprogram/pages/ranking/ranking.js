const { request } = require('../../utils/request')

Page({
  data: { ranking: [], startDate: '', endDate: '' },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const params = {}
    if (this.data.startDate) params.start_date = this.data.startDate
    if (this.data.endDate) params.end_date = this.data.endDate
    const ranking = await request({ url: `/api/houses/${houseId}/ranking`, data: params })
    this.setData({ ranking })
  },
  onDateChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value }, () => this.load())
  },
})
