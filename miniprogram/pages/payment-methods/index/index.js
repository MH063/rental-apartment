const { request } = require('../../../utils/request')

Page({
  data: {
    methods: [],
    showForm: false,
    typeIndex: 0,
    account: '',
    loading: true,
    typeOptions: ['支付宝', '微信', '银行卡'],
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      var methods = await request({ url: '/api/payment-methods' })
      this.setData({ methods: methods || [], loading: false })
    } catch {
      this.setData({ loading: false })
    }
  },

  onToggleForm() {
    this.setData({ showForm: !this.data.showForm, typeIndex: 0, account: '' })
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value })
  },

  async onAdd() {
    var type = this.data.typeOptions[this.data.typeIndex]
    var account = this.data.account.trim()
    if (!account) return wx.showToast({ title: '请输入收款账号', icon: 'none' })
    this.setData({ loading: true })
    try {
      await request({ url: '/api/payment-methods', method: 'POST', data: { type: type, account: account } })
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.setData({ showForm: false, typeIndex: 0, account: '' })
      this.load()
    } catch {
      this.setData({ loading: false })
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  onDelete(e) {
    var id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除支付方式',
      content: '确定删除？',
      success: function(res) {
        if (res.confirm) {
          var page = getCurrentPages().pop()
          page._doDelete(id)
        }
      },
    })
  },

  async _doDelete(id) {
    this.setData({ loading: true })
    try {
      await request({ url: '/api/payment-methods/' + id, method: 'DELETE' })
      wx.showToast({ title: '已删除', icon: 'success' })
      this.load()
    } catch {
      this.setData({ loading: false })
    }
  },

  onSetDefault(e) {
    var id = e.currentTarget.dataset.id
    this._doSetDefault(id)
  },

  async _doSetDefault(id) {
    try {
      await request({ url: '/api/payment-methods/' + id, method: 'PUT', data: { is_default: 1 } })
      wx.showToast({ title: '已设为默认', icon: 'success' })
      this.load()
    } catch {
      // silent
    }
  },
})
