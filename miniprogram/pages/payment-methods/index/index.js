const { request } = require('../../../utils/request')

Page({
  data: {
    methods: [],
    showModal: false,
    typeIndex: 0,
    account: '',
    qrLocal: '',
    qrUrl: '',
    loading: true,
    uploading: false,
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

  onOpenModal() {
    this.setData({ showModal: true, typeIndex: 0, account: '', qrLocal: '', qrUrl: '' })
  },

  onCloseModal() {
    this.setData({ showModal: false })
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value })
  },

  async onPickQr() {
    var res = await wx.chooseImage({ count: 1, sizeType: ['compressed'] })
    if (!res.tempFilePaths.length) return
    var path = res.tempFilePaths[0]
    this.setData({ qrLocal: path, uploading: true })
    try {
      var fs = wx.getFileSystemManager()
      var base64 = fs.readFileSync(path, 'base64')
      var up = await request({ url: '/api/upload', method: 'POST', data: { image: base64, filename: 'qrcode.jpg' } })
      this.setData({ qrUrl: up.url, uploading: false })
      wx.showToast({ title: '二维码已上传', icon: 'success' })
    } catch {
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  async onAdd() {
    var type = this.data.typeOptions[this.data.typeIndex]
    var account = this.data.account.trim()
    if (!account) return wx.showToast({ title: '请输入收款账号', icon: 'none' })
    this.setData({ loading: true })
    try {
      await request({
        url: '/api/payment-methods',
        method: 'POST',
        data: { type: type, account: account, qr_code: this.data.qrUrl || null },
      })
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.setData({ showModal: false })
      this.load()
    } catch {
      this.setData({ loading: false })
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  onPreviewQr(e) {
    var url = e.currentTarget.dataset.url
    if (url) wx.previewImage({ urls: [url] })
  },

  onDelete(e) {
    var id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除支付方式',
      content: '确定删除？',
      success: function(res) {
        if (res.confirm) getCurrentPages().pop()._doDelete(id)
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
