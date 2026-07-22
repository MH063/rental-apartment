const { request } = require('../../utils/request')

Page({
  data: { houses: [], currentHouseId: null, categories: [], budget: {} },
  onShow() {
    this.loadHouses()
    this.load()
  },
  async loadHouses() {
    const houses = await request({ url: `/api/houses` })
    this.setData({ houses, currentHouseId: getApp().globalData.currentHouseId })
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const [budget, categories] = await Promise.all([
      request({ url: `/api/houses/${houseId}/budget` }),
      request({ url: `/api/houses/${houseId}/categories` }),
    ])
    this.setData({ budget, categories })
  },
  onSwitchHouse(e) {
    const id = e.currentTarget.dataset.id
    getApp().globalData.currentHouseId = id
    this.setData({ currentHouseId: id })
    this.load()
    wx.showToast({ title: '已切换' })
  },
  async onSetBudget(e) {
    const { catId } = e.currentTarget.dataset
    const { value } = e.detail
    const houseId = getApp().globalData.currentHouseId
    await request({ url: `/api/houses/${houseId}/budget`, method: 'POST', data: { category_id: catId, amount: Number(value) * 100 } })
    wx.showToast({ title: '预算已设置' })
  },
})
