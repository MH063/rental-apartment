const { request } = require('../../utils/request')
const { BILL_STATUS } = require('../../utils/constants')

Page({
  data: {
    bills: [],
    filters: { status: '', category_id: '', keyword: '' },
    categories: [],
    page: 1,
    hasMore: true,
  },
  onLoad() {
    this.loadCategories()
  },
  onShow() {
    this.setData({ bills: [], page: 1, hasMore: true }, () => this.load())
  },
  async loadCategories() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const categories = await request({ url: `/api/houses/${houseId}/categories` })
    this.setData({ categories })
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId || !this.data.hasMore) return
    const { filters, page } = this.data
    const params = { ...filters, page, page_size: 20 }
    const res = await request({ url: `/api/houses/${houseId}/bills`, data: params })
    this.setData({
      bills: [...this.data.bills, ...(res.list || res)],
      hasMore: (res.list || res).length >= 20,
      page: page + 1,
    })
  },
  onSearch(e) {
    this.setData({ 'filters.keyword': e.detail.value, bills: [], page: 1, hasMore: true }, () => this.load())
  },
  onFilterStatus(e) {
    this.setData({ 'filters.status': e.detail.value === '全部' ? '' : e.detail.value, bills: [], page: 1, hasMore: true }, () => this.load())
  },
  onBillTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/bills/detail/detail?id=${id}` })
  },
})
