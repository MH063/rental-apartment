const { createStore } = require('./store')
const { request } = require('../utils/request')

const billStore = createStore({
  bills: [],
  page: 1,
  hasMore: true,
  filters: { status: '', category_id: '', keyword: '' },
  summary: null,
})

async function loadBills(reset = false) {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return

  const { filters, page, hasMore } = billStore.state
  if (!reset && !hasMore) return

  const p = reset ? 1 : page
  const params = { ...filters, page: p, page_size: 20 }
  const res = await request({ url: `/api/houses/${houseId}/bills`, data: params })

  billStore.setState({
    bills: reset ? (res.list || res) : [...billStore.state.bills, ...(res.list || res)],
    page: p + 1,
    hasMore: (res.list || res).length >= 20,
  })
}

function setBillFilter(filters) {
  billStore.setState({ filters: { ...billStore.state.filters, ...filters }, bills: [], page: 1, hasMore: true })
  loadBills(true)
}

async function loadBillSummary() {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return
  const summary = await request({ url: `/api/houses/${houseId}/stats/trend` })
  billStore.setState({ summary })
}

module.exports = { billStore, loadBills, loadBillSummary, setBillFilter }
