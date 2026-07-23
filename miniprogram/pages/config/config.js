const { request } = require('../../utils/request')

Page({
  data: {
    houses: [],
    currentHouseId: null,
    categories: [],
    budgetMap: {},
    loading: true,
  },

  onShow() {
    this.loadAll()
  },

  async loadAll() {
    this.setData({ loading: true })
    try {
      const houses = await request({ url: '/api/houses' })
      const houseId = getApp().globalData.currentHouseId
      this.setData({ houses, currentHouseId: houseId })
      if (houseId) {
        const [budget, categories] = await Promise.all([
          request({ url: '/api/houses/' + houseId + '/budget' }),
          request({ url: '/api/houses/' + houseId + '/categories' }),
        ])
        var budgetMap = {}
        if (budget && typeof budget === 'object') {
          for (var key in budget) {
            if (budget[key] != null) {
              budgetMap[key] = String(budget[key] / 100)
            }
          }
        }
        this.setData({ budgetMap: budgetMap, categories: categories || [] })
      }
    } catch {
      // silent
    } finally {
      this.setData({ loading: false })
    }
  },

  onSwitchHouse(e) {
    var id = e.currentTarget.dataset.id
    getApp().globalData.currentHouseId = id
    wx.setStorageSync('currentHouseId', id)
    this.setData({ currentHouseId: id, budgetMap: {}, categories: [] })
    this.loadAll()
    wx.showToast({ title: '已切换', icon: 'success' })
  },

  onBudgetInput(e) {
    var catId = e.currentTarget.dataset.catId
    var value = e.detail.value
    var budgetMap = {}
    for (var key in this.data.budgetMap) budgetMap[key] = this.data.budgetMap[key]
    budgetMap[catId] = value
    this.setData({ budgetMap: budgetMap })
  },

  async onSetBudget(e) {
    var catId = e.currentTarget.dataset.catId
    var value = e.detail.value
    var houseId = getApp().globalData.currentHouseId
    if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })
    if (!value || isNaN(Number(value))) return

    var fullBudget = {}
    for (var key in this.data.budgetMap) {
      var val = Number(this.data.budgetMap[key])
      if (!isNaN(val) && val > 0) fullBudget[key] = Math.round(val * 100)
    }
    fullBudget[catId] = Math.round(Number(value) * 100)

    try {
      await request({ url: '/api/houses/' + houseId + '/budget', method: 'POST', data: fullBudget })
      wx.showToast({ title: '预算已保存', icon: 'success' })
    } catch {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },
})
