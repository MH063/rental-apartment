const { request } = require('../../../utils/request')

Page({
  data: { name: '', address: '' },
  async onSubmit() {
    const { name, address } = this.data
    if (!name) return wx.showToast({ title: '请输入房屋名称', icon: 'none' })
    const res = await request({ url: `/api/houses`, method: 'POST', data: { name, address } })
    getApp().globalData.currentHouseId = res.id
    wx.showToast({ title: '创建成功' })
    wx.navigateTo({ url: `/pages/house/qrcode/qrcode` })
  },
})
