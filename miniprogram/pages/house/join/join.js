const { request } = require('../../../utils/request')

Page({
  data: {
    code: '',
    codeArr: ['', '', '', '', '', ''],
    focusIndex: 0,
    loading: false,
    error: '',
  },

  onLoad(opts) {
    if (opts.code) {
      const code = String(opts.code).slice(0, 6)
      const codeArr = code.split('').concat(Array(6 - code.length).fill(''))
      this.setData({ code, codeArr, focusIndex: Math.min(code.length, 5) })
      setTimeout(() => this.onLookup(), 500)
    }
  },

  onInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    let value = e.detail.value
    value = value.replace(/\D/g, '').slice(0, 1)

    const codeArr = this.data.codeArr.slice()
    codeArr[index] = value
    const code = codeArr.join('')

    let focusIndex = index
    if (value && index < 5) {
      focusIndex = index + 1
    }

    this.setData({ codeArr, code, focusIndex, error: '' })
  },

  onTapCell(e) {
    this.setData({ focusIndex: Number(e.currentTarget.dataset.index), error: '' })
  },

  async onLookup() {
    const { code } = this.data
    if (code.length !== 6) {
      return wx.showToast({ title: '请输入完整的6位邀请码', icon: 'none' })
    }

    this.setData({ loading: true, error: '' })
    try {
      const res = await request({ url: '/api/houses/join', method: 'POST', data: { invite_code: code } })
      getApp().globalData.currentHouseId = res.house_id
      wx.setStorageSync('currentHouseId', res.house_id)
      wx.showToast({ title: '加入成功', icon: 'success' })
      wx.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      const msg = e.error || '邀请码无效或已过期'
      this.setData({ error: msg })
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
