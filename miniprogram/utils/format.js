function centsToYuan(cents) {
  return (cents / 100).toFixed(2)
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

module.exports = { centsToYuan, formatDate, maskPhone }
