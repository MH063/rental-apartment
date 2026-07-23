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
    let value = e.detail.value.replace(/\D/g, '')

    if (!value) return

    // 粘贴支持：用户粘贴超过1位，自动分配到后续格子
    const codeArr = this.data.codeArr.slice()
    for (let i = 0; i < value.length && index + i < 6; i++) {
      codeArr[index + i] = value[i]
    }
    const code = codeArr.join('')
    const nextIndex = Math.min(index + value.length, 5)

    this.setData({ codeArr, code, focusIndex: code.length < 6 ? Math.min(nextIndex, 5) : 5, error: '' })
  },

  onTapCell(e) {
    this.setData({ focusIndex: Number(e.currentTarget.dataset.index), error: '' })
  },

  onScan() {
    wx.switchTab({ url: '/pages/scan/scan' })
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
