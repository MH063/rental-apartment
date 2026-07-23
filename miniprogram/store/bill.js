const { createStore } = require('./store')
const { request } = require('../utils/request')

const billStore = createStore({
  bills: [],
  page: 1,
  hasMore: true,
  cursor: null,
  filters: { status: '', category_id: '', keyword: '' },
  summary: null,
})

/**
 * 加载账单列表
 * 后端 /api/bills 接口返回 { items, next_cursor } 结构，支持游标分页
 * @param {boolean} reset - 是否重置到第一页
 */
async function loadBills(reset = false) {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return

  const { filters, cursor, hasMore } = billStore.state
  if (!reset && !hasMore) return

  // 构造查询参数：house_id 必传，游标仅在加载下一页时传
  const params = { house_id: houseId, ...filters, limit: 20 }
  if (!reset && cursor) {
    params.cursor = cursor
  }

  const res = await request({ url: '/api/bills', data: params })

  // 后端返回 { items, next_cursor } 结构
  const items = res.items || []
  const nextCursor = res.next_cursor || null

  billStore.setState({
    bills: reset ? items : [...billStore.state.bills, ...items],
    cursor: nextCursor,
    page: reset ? 1 : billStore.state.page + 1,
    hasMore: items.length >= 20 && !!nextCursor,
  })
}

function setBillFilter(filters) {
  billStore.setState({
    filters: { ...billStore.state.filters, ...filters },
    bills: [],
    page: 1,
    hasMore: true,
    cursor: null,
  })
  loadBills(true)
}

async function loadBillSummary() {
  const houseId = getApp().globalData.currentHouseId
  if (!houseId) return
  const summary = await request({ url: `/api/houses/${houseId}/stats/trend` })
  billStore.setState({ summary })
}

module.exports = { billStore, loadBills, loadBillSummary, setBillFilter }
