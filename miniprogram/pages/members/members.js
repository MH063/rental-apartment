const { request } = require('../../utils/request')

Page({
  data: { members: [], house: null, currentRole: '' },
  onShow() {
    this.load()
  },
  async load() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return

    const [members, house] = await Promise.all([
      request({ url: `/api/houses/${houseId}/members` }),
      request({ url: `/api/houses/${houseId}` }),
    ])
    this.setData({ members, house })
  },
  async onChangeRole(e) {
    const { userId, role } = e.currentTarget.dataset
    await request({ url: `/api/houses/${this.data.house.id}/members/${userId}/role`, method: 'PUT', data: { role } })
    wx.showToast({ title: '已更新' })
    this.load()
  },
  async onRemove(e) {
    const userId = e.currentTarget.dataset.userId
    wx.showModal({
      title: '移除成员',
      content: '确定要移除该成员吗？',
      success: async (res) => {
        if (res.confirm) {
          await request({ url: `/api/houses/${this.data.house.id}/members/${userId}`, method: 'DELETE' })
          wx.showToast({ title: '已移除' })
          this.load()
        }
      }
    })
  },
})
