const { request } = require('../../utils/request')

Page({
  data: { bills: [] },
  onShow() {
    this.load()
  },
  async load() {
    const bills = await request({ url: `/api/bills/my` })
    this.setData({ bills })
  },
})
