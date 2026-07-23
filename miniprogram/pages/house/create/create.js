const { request } = require('../../../utils/request')

Page({
  data: {
    name: '',
    address: '',
    submitting: false,
    nameError: '',
    addressError: '',
  },

  onNameInput(e) {
    const name = e.detail.value
    this.setData({
      name,
      nameError: name.length > 50 ? '名称不能超过50个字' : '',
    })
  },

  onAddressInput(e) {
    const address = e.detail.value
    this.setData({
      address,
      addressError: address.length > 100 ? '地址不能超过100个字' : '',
    })
  },

  canSubmit() {
    const { name, submitting, nameError } = this.data
    return !submitting && name.trim() && !nameError
  },

  async onSubmit() {
    const { name, address } = this.data
    if (!name.trim()) {
      return wx.showToast({ title: '请输入房屋名称', icon: 'none' })
    }
    this.setData({ submitting: true })
    try {
      const res = await request({
        url: '/api/houses',
        method: 'POST',
        data: { name: name.trim(), address: address.trim() },
      })
      getApp().globalData.currentHouseId = res.id
      wx.setStorageSync('currentHouseId', res.id)
      wx.showToast({ title: '创建成功', icon: 'success' })
      wx.redirectTo({ url: '/pages/house/qrcode/qrcode' })
    } catch (e) {
      wx.showToast({ title: e.error || '创建失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
