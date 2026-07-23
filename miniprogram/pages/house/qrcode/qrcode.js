const { request } = require('../../../utils/request')

Page({
  data: { inviteCode: '', qrData: '', qrImage: '' },
  onShow() {
    this.loadCode()
  },
  async loadCode() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) return
    const res = await request({ url: `/api/houses/${houseId}` })
    const text = `invite:${res.invite_code}`
    this.setData({
      inviteCode: res.invite_code,
      qrData: text,
      qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`,
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
          // 后端路由为 POST /api/houses/:id/invite-code/renew
          const data = await request({ url: `/api/houses/${houseId}/invite-code/renew`, method: 'POST' })
          const text = `invite:${data.invite_code}`
          this.setData({
            inviteCode: data.invite_code,
            qrData: text,
            qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`,
          })
          wx.showToast({ title: '已重新生成' })
        }
      }
    })
  },
})
