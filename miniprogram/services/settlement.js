const { request } = require('../utils/request')

async function createSettlement(houseId, data) {
  return request({ url: '/api/settlements', method: 'POST', data: { house_id: houseId, ...data } })
}

async function getSettlement(id) {
  return request({ url: `/api/settlements/${id}` })
}

async function listSettlements(houseId) {
  return request({ url: '/api/settlements', data: { house_id: houseId } })
}

async function confirmSettlement(id) {
  return request({ url: `/api/settlements/${id}/confirm`, method: 'POST' })
}

async function transferSettlement(id) {
  return request({ url: `/api/settlements/${id}/transfer`, method: 'POST' })
}

async function confirmItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/confirm`, method: 'POST' })
}

async function transferItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/transfer`, method: 'POST' })
}

async function undo(settlementId) {
  return request({ url: `/api/settlements/${settlementId}/undo`, method: 'POST' })
}

async function undoItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/undo`, method: 'POST' })
}

async function createPartialPayment(settlementId, itemId, data) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments`, method: 'POST', data })
}

async function listPartialPayments(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments` })
}

async function deletePartialPayment(settlementId, itemId, pid) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments/${pid}`, method: 'DELETE' })
}

module.exports = {
  createSettlement, getSettlement, listSettlements,
  confirmSettlement, transferSettlement,
  confirmItem, transferItem, undo, undoItem,
  createPartialPayment, listPartialPayments, deletePartialPayment,
}
