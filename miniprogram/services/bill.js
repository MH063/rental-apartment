const { request } = require('../utils/request')

async function createBill(houseId, data) {
  return request({ url: `/api/houses/${houseId}/bills`, method: 'POST', data })
}

async function getBill(id) {
  return request({ url: `/api/bills/${id}` })
}

async function listBills(houseId, params) {
  return request({ url: `/api/houses/${houseId}/bills`, data: params })
}

async function confirmBill(houseId, billId) {
  return request({ url: `/api/houses/${houseId}/bills/${billId}/confirm`, method: 'POST' })
}

async function getMyBills(houseId, params) {
  return request({ url: `/api/houses/${houseId}/bills/my`, data: params })
}

module.exports = { createBill, getBill, listBills, confirmBill, getMyBills }
