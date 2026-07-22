const { billStore, loadBills, setBillFilter } = require('../../../store/index')
const { request } = require('../../../utils/request')

Page({
  data: { categories: [] },
  onLoad() {
    billStore.connect(this, 'bill')
    this.loadCategories()
  },
  async loadCategories() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const categories = await request({ url: `/api/houses/${houseId}/categories` })
    this.setData({ categories })
  },
  onShow() {
    loadBills(true)
  },
  onSearch(e) {
    setBillFilter({ keyword: e.detail.value })
  },
  onFilterStatus(e) {
    setBillFilter({ status: e.detail.value === '全部' ? '' : e.detail.value })
  },
  onScrollBottom() {
    loadBills()
  },
  onBillTap(e) {
    wx.navigateTo({ url: `/pages/bills/detail/detail?id=${e.currentTarget.dataset.id}` })
  },
})
