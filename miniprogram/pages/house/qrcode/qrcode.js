const { request } = require('../../../utils/request')

Page({
  data: { inviteCode: '', qrData: '' },
  onShow() {
    this.loadCode()
  },
  async loadCode() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const res = await request({ url: `/api/houses/${houseId}` })
    this.setData({
      inviteCode: res.invite_code,
      qrData: `invite:${res.invite_code}`
    })
  },
  onShare() {
    wx.setClipboardData({ data: this.data.inviteCode, success: () => wx.showToast({ title: '已复制邀请码' }) })
  },
  onRenew() {
    wx.showModal({
      title: '重新生成',
      content: '将生成新的邀请码，旧码将失效',
      success: async (res) => {
        if (res.confirm) {
          const houseId = getApp().globalData.currentHouseId
          const data = await request({ url: `/api/houses/${houseId}/invite-code`, method: 'POST' })
          this.setData({ inviteCode: data.invite_code, qrData: `invite:${data.invite_code}` })
          wx.showToast({ title: '已重新生�? })
        }
      }
    })
  },
})
