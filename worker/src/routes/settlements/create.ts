import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../../types"
import { authMiddleware } from "../../middleware/auth"
import { settle } from "../../algorithms/settlement"

export const create = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
create.use("*", authMiddleware)

create.post("/settlements", async (c) => {
  const { userId } = c.var.user
  const { house_id, title, start_date, end_date } = await c.req.json<{
    house_id: number; title?: string; start_date: string; end_date: string
  }>()

  if (!house_id || !start_date || !end_date) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const bills = await c.env.DB.prepare(`
    SELECT id, creator_id, total_amount FROM bills
    WHERE house_id = ? AND bill_date >= ? AND bill_date <= ?
    AND status IN ('已确认', '争议中', '再次确认', '待支付', '已支付')
  `).bind(house_id, start_date, end_date).all()

  if (!bills.results.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const billIds = bills.results.map((b: Record<string, unknown>) => b.id)
  const placeholders = billIds.map(() => "?").join(",")

  const splits = await c.env.DB.prepare(`
    SELECT bill_id, user_id, amount FROM splits WHERE bill_id IN (${placeholders})
  `).bind(...billIds).all<{ bill_id: number; user_id: number; amount: number }>()

  const balanceMap = new Map<number, number>()
  for (const bill of bills.results as Array<Record<string, unknown>>) {
    const creatorId = bill.creator_id as number
    const total = bill.total_amount as number
    if (!balanceMap.has(creatorId)) balanceMap.set(creatorId, 0)
    balanceMap.set(creatorId, balanceMap.get(creatorId)! + total)
  }
  for (const split of splits.results) {
    const current = balanceMap.get(split.user_id) ?? 0
    balanceMap.set(split.user_id, current - split.amount)
  }

  const balances = Array.from(balanceMap.entries())
    .filter(([_, amount]) => amount !== 0)
    .map(([userId, amount]) => ({ userId, amount }))

  if (!balances.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const transfers = settle(balances)

  const result = await c.env.DB.prepare(`
    INSERT INTO settlements (house_id, title, start_date, end_date, creator_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(house_id, title || `${start_date} ~ ${end_date} 结算`, start_date, end_date, userId).run()
  const settlementId = Number(result.meta.last_row_id)

  const stmt = c.env.DB.prepare(
    "INSERT INTO settlement_items (settlement_id, payer_id, payee_id, original_amount, final_amount) VALUES (?, ?, ?, ?, ?)"
  )
  for (const t of transfers) {
    await stmt.bind(settlementId, t.from, t.to, t.amount, t.amount).run()
  }

  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
    VALUES (?, ?, 'create_settlement', 'settlements', ?, ?)
  `).bind(house_id, userId, settlementId,
    JSON.stringify({ bill_count: bills.results.length, transfer_count: transfers.length })).run()

  const settlement = await c.env.DB.prepare("SELECT * FROM settlements WHERE id = ?").bind(settlementId).first()
  const items = await c.env.DB.prepare(`
    SELECT si.*, payer.nickname AS payer_name, payee.nickname AS payee_name
    FROM settlement_items si JOIN users payer ON payer.id = si.payer_id
    JOIN users payee ON payee.id = si.payee_id
    WHERE si.settlement_id = ? ORDER BY si.id
  `).bind(settlementId).all()

  return c.json({ success: true, data: { ...settlement, items: items.results } })
})
