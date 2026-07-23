const { request } = require('../utils/request')

/**
 * 创建账单
 * 后端路由：POST /api/bills（house_id 在 body 中）
 */
async function createBill(houseId, data) {
  return request({ url: '/api/bills', method: 'POST', data: { ...data, house_id: houseId } })
}

/**
 * 获取账单详情
 * 后端路由：GET /api/bills/:id
 */
async function getBill(id) {
  return request({ url: `/api/bills/${id}` })
}

/**
 * 获取账单列表
 * 后端路由：GET /api/bills?house_id=xxx
 */
async function listBills(houseId, params) {
  return request({ url: '/api/bills', data: { ...params, house_id: houseId } })
}

/**
 * 确认账单（草稿 → 已确认）
 * 后端路由：POST /api/bills/:id/confirm
 */
async function confirmBill(billId) {
  return request({ url: `/api/bills/${billId}/confirm`, method: 'POST' })
}

/**
 * 获取我的账单
 * 后端路由：GET /api/bills/my?house_id=xxx
 */
async function getMyBills(houseId, params) {
  return request({ url: '/api/bills/my', data: { ...params, house_id: houseId } })
}

module.exports = { createBill, getBill, listBills, confirmBill, getMyBills }
