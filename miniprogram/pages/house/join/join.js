const { request } = require('../../../utils/request')

Page({
  data: {
    code: '',
    codeArr: ['', '', '', '', '', ''],
    focusIndex: 0,
    inviteInfo: null,
    loading: false,
  },

  onLoad(opts) {
    // 支持外部传入完整邀请码（如扫码跳转）
    if (opts.code) {
      const code = String(opts.code).slice(0, 6)
      const codeArr = code.split('').concat(Array(6 - code.length).fill(''))
      this.setData({ code, codeArr, focusIndex: Math.min(code.length, 5) })
      setTimeout(() => this.onLookup(), 500)
    }
  },

  /**
   * 处理每个验证码输入框的输入事件
   * 输入一位后自动聚焦到下一个输入框
   */
  onInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    let value = e.detail.value
    // 只允许输入单个数字
    value = value.replace(/\D/g, '').slice(0, 1)

    const codeArr = this.data.codeArr.slice()
    codeArr[index] = value
    const code = codeArr.join('')

    // 当前框有值且不是最后一个，自动跳到下一个
    let focusIndex = index
    if (value && index < 5) {
      focusIndex = index + 1
    }

    this.setData({ codeArr, code, focusIndex })
  },

  /**
   * 点击某个输入框时聚焦到该框
   */
  onTapCell(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({ focusIndex: index })
  },

  async onLookup() {
    const { code } = this.data
    if (code.length !== 6) {
      return wx.showToast({ title: '请输入6位邀请码', icon: 'none' })
    }

    this.setData({ loading: true })
    try {
      const res = await request({ url: '/api/houses/join', method: 'POST', data: { invite_code: code } })
      getApp().globalData.currentHouseId = res.house_id
      wx.setStorageSync('currentHouseId', res.house_id)
      wx.showToast({ title: '加入成功' })
      wx.switchTab({ url: '/pages/index/index' })
    } catch (e) {
      wx.showToast({ title: e.error || '无效的邀请码', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
