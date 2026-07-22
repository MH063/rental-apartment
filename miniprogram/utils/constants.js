const BILL_STATUS = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  DISPUTED: '争议中',
  RE_CONFIRMED: '再次确认',
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
}

const SPLIT_TYPES = {
  EQUAL: '均摊',
  WEIGHT: '权重',
  DAYS: '天数',
  USAGE: '用量',
  AREA: '面积',
  TIER: '阶梯',
}

const ROLES = {
  ADMIN: '系统管理员',
  LEADER: '寝室长',
  MEMBER: '普通成员',
}

module.exports = { BILL_STATUS, SPLIT_TYPES, ROLES }
