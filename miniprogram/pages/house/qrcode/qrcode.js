const { request } = require('../../../utils/request')

Page({
  data: {
    house: null,
    inviteCode: '',
    qrImage: '',
    expiresAt: '',
    expireDate: '',
    rentDisplay: '',
    loading: true,
    error: '',
  },

  onShow() {
    this.loadCode()
  },

  async loadCode() {
    const houseId = getApp().globalData.currentHouseId
    if (!houseId) {
      this.setData({ loading: false, error: '未找到房屋信息' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const house = await request({ url: `/api/houses/${houseId}` })
      const text = 'invite:' + house.invite_code
      this.setData({
        house,
        inviteCode: house.invite_code,
        qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(text),
        expiresAt: house.invite_code_expires_at || '',
        expireDate: house.invite_code_expires_at ? house.invite_code_expires_at.slice(0, 10) : '',
        rentDisplay: house.monthly_rent ? '¥' + (house.monthly_rent / 100).toFixed(0) : '',
        loading: false,
      })
    } catch {
      this.setData({ loading: false, error: '加载失败，请重试' })
    }
  },

  onCopy() {
    wx.setClipboardData({ data: this.data.inviteCode, success: () => wx.showToast({ title: '已复制邀请码' }) })
  },

  onRenew() {
    wx.showModal({
      title: '重新生成',
      content: '将生成新的邀请码，旧码立即失效，仅寝室长可操作',
      success: async (res) => {
        if (!res.confirm) return
        const houseId = getApp().globalData.currentHouseId
        this.setData({ loading: true })
        try {
          const data = await request({ url: '/api/houses/' + houseId + '/invite-code/renew', method: 'POST' })
          const text = 'invite:' + data.invite_code
          this.setData({
            inviteCode: data.invite_code,
            qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(text),
            expiresAt: data.invite_code_expires_at || '',
            expireDate: data.invite_code_expires_at ? data.invite_code_expires_at.slice(0, 10) : '',
            loading: false,
          })
          wx.showToast({ title: '已重新生成', icon: 'success' })
        } catch (e) {
          this.setData({ loading: false })
          wx.showToast({ title: e.error || '操作失败', icon: 'none' })
        }
      },
    })
  },

  onShareAppMessage() {
    const name = this.data.house ? this.data.house.name : '合租房屋'
    return {
      title: '邀请你加入「' + name + '」',
      path: '/pages/house/join/join?code=' + this.data.inviteCode,
    }
  },
})
