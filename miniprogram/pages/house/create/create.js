const { request } = require('../../../utils/request')

const UNIT_TYPES = ['1室0厅1卫', '1室1厅1卫', '2室1厅1卫', '2室2厅2卫', '3室1厅1卫', '3室2厅1卫', '3室2厅2卫', '4室2厅2卫', '4室2厅3卫', '其他']

function yuanToCents(v) { return Math.round(parseFloat(v || '0') * 100) }

Page({
  data: {
    name: '',
    address: '',
    unitTypeIndex: 0,
    showCustomUnitType: false,
    unitTypeCustom: '',
    areaDisplay: '',
    floor: '',
    monthlyRentDisplay: '',
    depositDisplay: '',
    propertyFeeDisplay: '',
    leaseStart: '',
    leaseEnd: '',
    landlord: '',
    utilityAccounts: '',
    notes: '',
    submitting: false,
    unitTypes: UNIT_TYPES,
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onAddressInput(e) { this.setData({ address: e.detail.value }) },
  onAreaInput(e) { this.setData({ areaDisplay: e.detail.value }) },
  onFloorInput(e) { this.setData({ floor: e.detail.value }) },
  onRentInput(e) { this.setData({ monthlyRentDisplay: e.detail.value }) },
  onDepositInput(e) { this.setData({ depositDisplay: e.detail.value }) },
  onPropertyFeeInput(e) { this.setData({ propertyFeeDisplay: e.detail.value }) },
  onLandlordInput(e) { this.setData({ landlord: e.detail.value }) },
  onUtilityInput(e) { this.setData({ utilityAccounts: e.detail.value }) },
  onNotesInput(e) { this.setData({ notes: e.detail.value }) },

  onUnitTypeChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      unitTypeIndex: idx,
      showCustomUnitType: idx === UNIT_TYPES.length - 1,
    })
  },

  onUnitTypeCustomInput(e) {
    this.setData({ unitTypeCustom: e.detail.value })
  },

  onLeaseStartChange(e) {
    this.setData({ leaseStart: e.detail.value })
  },

  onLeaseEndChange(e) {
    this.setData({ leaseEnd: e.detail.value })
  },

  canSubmit() {
    const { name, submitting } = this.data
    return !submitting && name.trim()
  },

  async onSubmit() {
    const d = this.data
    if (!d.name.trim()) {
      return wx.showToast({ title: '请输入房屋名称', icon: 'none' })
    }
    this.setData({ submitting: true })
    try {
      const unitType = d.showCustomUnitType
        ? d.unitTypeCustom.trim()
        : UNIT_TYPES[d.unitTypeIndex]

      const res = await request({
        url: '/api/houses',
        method: 'POST',
        data: {
          name: d.name.trim(),
          address: d.address.trim(),
          unit_type: unitType,
          area: parseFloat(d.areaDisplay) || null,
          floor: d.floor.trim(),
          monthly_rent: yuanToCents(d.monthlyRentDisplay) || null,
          deposit: yuanToCents(d.depositDisplay) || null,
          property_fee: yuanToCents(d.propertyFeeDisplay) || null,
          lease_start: d.leaseStart || null,
          lease_end: d.leaseEnd || null,
          landlord: d.landlord.trim(),
          utility_accounts: d.utilityAccounts.trim(),
          notes: d.notes.trim(),
        },
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
