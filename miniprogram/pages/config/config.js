const { request } = require('../../utils/request')

Page({
  data: {
    houses: [],
    currentHouseId: null,
    categories: [],
    // budgetMap: { [category_id]: 金额(元，字符串) } 用于回显输入框
    budgetMap: {},
  },
  onShow() {
    this.loadHouses()
    this.load()
  },
  /**
   * 加载房屋列表
   */
  async loadHouses() {
    try {
      const houses = await request({ url: '/api/houses' })
      this.setData({ houses, currentHouseId: getApp().globalData.currentHouseId })
    } catch (e) {
      console.error('[config] 加载房屋失败:', e)
    }
  },
  /**
   * 加载当前房屋的预算和分类
   */
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    try {
      const [budget, categories] = await Promise.all([
        request({ url: `/api/houses/${houseId}/budget` }),
        request({ url: `/api/houses/${houseId}/categories` }),
      ])
      // 将预算从分转为元，构建 { category_id: "金额元" } 映射用于回显
      const budgetMap = {}
      if (budget && typeof budget === 'object') {
        for (const key in budget) {
          if (budget[key] != null) {
            budgetMap[key] = String(budget[key] / 100)
          }
        }
      }
      this.setData({ budgetMap, categories })
    } catch (e) {
      console.error('[config] 加载预算失败:', e)
    }
  },
  /**
   * 切换当前房屋
   */
  onSwitchHouse(e) {
    const id = e.currentTarget.dataset.id
    getApp().globalData.currentHouseId = id
    wx.setStorageSync('currentHouseId', id)
    this.setData({ currentHouseId: id, budgetMap: {} })
    this.load()
    wx.showToast({ title: '已切换', icon: 'success' })
  },
  /**
   * 输入预算时实时更新本地映射（不立即提交）
   */
  onBudgetInput(e) {
    const { catId } = e.currentTarget.dataset
    const { value } = e.detail
    const budgetMap = { ...this.data.budgetMap }
    budgetMap[catId] = value
    this.setData({ budgetMap })
  },
  /**
   * 失焦时提交单个分类预算（合并到完整预算对象后提交）
   */
  async onSetBudget(e) {
    const { catId } = e.currentTarget.dataset
    const { value } = e.detail
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return wx.showToast({ title: '请先加入房屋', icon: 'none' })

    // 空值时跳过提交，避免误清零
    if (!value || isNaN(Number(value))) return

    // 构建完整预算对象：将 budgetMap 中所有值转为分，合并当前分类
    const fullBudget = {}
    const { budgetMap } = this.data
    for (const key in budgetMap) {
      const val = Number(budgetMap[key])
      if (!isNaN(val) && val > 0) {
        fullBudget[key] = Math.round(val * 100)
      }
    }
    // 确保当前分类的值已包含
    fullBudget[catId] = Math.round(Number(value) * 100)

    try {
      await request({
        url: `/api/houses/${houseId}/budget`,
        method: 'POST',
        data: fullBudget,
      })
      wx.showToast({ title: '预算已保存', icon: 'success' })
    } catch (e) {
      console.error('[config] 保存预算失败:', e)
    }
  },
})
