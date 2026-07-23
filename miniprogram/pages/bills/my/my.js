const { request } = require('../../../utils/request')

// 账单状态中文映射
const STATUS_MAP = {
  'pending': '待支付',
  'paid': '已支付',
  'confirmed': '已确认',
  'disputed': '争议中',
  're-confirmed': '再次确认',
  'cancelled': '已取消',
}

Page({
  data: { bills: [], hasHouse: true },
  onShow() {
    this.load()
  },
  /**
   * 加载我的账单列表
   */
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) {
      this.setData({ hasHouse: false, bills: [] })
      return
    }
    this.setData({ hasHouse: true })
    try {
      const bills = await request({ url: '/api/bills/my', data: { house_id: houseId } })
      this.setData({ bills: bills || [] })
    } catch (e) {
      console.error('[my-bills] 加载失败:', e)
    }
  },
  /**
   * 跳转到账单详情
   */
  onTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/bills/detail/detail?id=${id}` })
  },
  /**
   * 跳转到创建账单页
   */
  onCreate() {
    wx.navigateTo({ url: '/pages/bills/create/create' })
  },
})
