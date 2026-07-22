const { request } = require('../utils/request')

async function listMethods() {
  return request({ url: '/api/payment-methods' })
}

async function addMethod(data) {
  return request({ url: '/api/payment-methods', method: 'POST', data })
}

async function deleteMethod(id) {
  return request({ url: `/api/payment-methods/${id}`, method: 'DELETE' })
}

async function setDefault(id) {
  return request({ url: `/api/payment-methods/${id}`, method: 'PUT', data: { is_default: 1 } })
}

module.exports = { listMethods, addMethod, deleteMethod, setDefault }
