const { request } = require('../../../utils/request')

Page({
  data: { methods: [], showForm: false, type: '', account: '' },
  onShow() {
    this.load()
  },
  async load() {
    const methods = await request({ url: `/api/payment-methods` })
    this.setData({ methods })
  },
  onToggleForm() {
    this.setData({ showForm: !this.data.showForm, type: '', account: '' })
  },
  async onAdd() {
    const { type, account } = this.data
    if (!type || !account) return wx.showToast({ title: '请填写完�?, icon: 'none' })
    await request({ url: `/api/payment-methods`, method: 'POST', data: { type, account } })
    wx.showToast({ title: '添加成功' })
    this.setData({ showForm: false, type: '', account: '' })
    this.load()
  },
  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除',
      content: '确定删除该支付方式？',
      success: async (res) => {
        if (res.confirm) {
          await request({ url: `/api/payment-methods/${id}`, method: 'DELETE' })
          wx.showToast({ title: '已删�? })
          this.load()
        }
      }
    })
  },
  async onSetDefault(e) {
    const id = e.currentTarget.dataset.id
    await request({ url: `/api/payment-methods/${id}`, method: 'PUT', data: { is_default: 1 } })
    wx.showToast({ title: '已设为默�? })
    this.load()
  },
})
