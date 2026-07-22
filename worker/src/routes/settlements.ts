import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { settle } from "../algorithms/settlement"

export const settlements = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

settlements.use("*", authMiddleware)

// List settlements for a house
settlements.get("/settlements", async (c) => {
  const { userId } = c.var.user
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE house_id = ? ORDER BY created_at DESC"
  ).bind(Number(houseId)).all()

  return c.json({ success: true, data: list.results })
})

// Create settlement
settlements.post("/settlements", async (c) => {
  const { userId } = c.var.user
  const { house_id, title, start_date, end_date } = await c.req.json<{
    house_id: number
    title?: string
    start_date: string
    end_date: string
  }>()

  if (!house_id || !start_date || !end_date) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  // Fetch all confirmed+ bills in date range
  const bills = await c.env.DB.prepare(`
    SELECT id, creator_id, total_amount FROM bills
    WHERE house_id = ? AND bill_date >= ? AND bill_date <= ?
    AND status IN ('已确认', '争议中', '再次确认', '待支付', '已支付')
  `).bind(house_id, start_date, end_date).all()

  if (!bills.results.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  // Fetch all splits for these bills
  const billIds = bills.results.map((b: Record<string, unknown>) => b.id)
  const placeholders = billIds.map(() => "?").join(",")

  const splits = await c.env.DB.prepare(`
    SELECT bill_id, user_id, amount FROM splits WHERE bill_id IN (${placeholders})
  `).bind(...billIds).all<{ bill_id: number; user_id: number; amount: number }>()

  // Calculate net balance per member
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

  // Build balance list for settlement algorithm
  const balances = Array.from(balanceMap.entries())
    .filter(([_, amount]) => amount !== 0)
    .map(([userId, amount]) => ({ userId, amount }))

  if (!balances.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  // Run greedy settlement algorithm
  const transfers = settle(balances)

  // Create settlement record
  const result = await c.env.DB.prepare(`
    INSERT INTO settlements (house_id, title, start_date, end_date, creator_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(house_id, title || `${start_date} ~ ${end_date} 结算`, start_date, end_date, userId).run()
  const settlementId = Number(result.meta.last_row_id)

  // Create settlement_items
  const stmt = c.env.DB.prepare(`
    INSERT INTO settlement_items (settlement_id, payer_id, payee_id, original_amount, final_amount)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const t of transfers) {
    await stmt.bind(settlementId, t.from, t.to, t.amount, t.amount).run()
  }

  // Log operation
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
    VALUES (?, ?, 'create_settlement', 'settlements', ?, ?)
  `).bind(house_id, userId, settlementId, JSON.stringify({ bill_count: bills.results.length, transfer_count: transfers.length })).run()

  // Return complete settlement
  const settlement = await c.env.DB.prepare("SELECT * FROM settlements WHERE id = ?").bind(settlementId).first()
  const items = await c.env.DB.prepare(`
    SELECT si.*, payer.nickname AS payer_name, payee.nickname AS payee_name
    FROM settlement_items si
    JOIN users payer ON payer.id = si.payer_id
    JOIN users payee ON payee.id = si.payee_id
    WHERE si.settlement_id = ? ORDER BY si.id
  `).bind(settlementId).all()

  return c.json({ success: true, data: { ...settlement, items: items.results } })
})

// Get settlement detail
settlements.get("/settlements/:id", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare("SELECT * FROM settlements WHERE id = ?").bind(settlementId).first<{ house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const items = await c.env.DB.prepare(`
    SELECT si.*, payer.nickname AS payer_name, payer.avatar AS payer_avatar,
           payee.nickname AS payee_name, payee.avatar AS payee_avatar
    FROM settlement_items si
    JOIN users payer ON payer.id = si.payer_id
    JOIN users payee ON payee.id = si.payee_id
    WHERE si.settlement_id = ? ORDER BY si.id
  `).bind(settlementId).all()

  const challenges = await c.env.DB.prepare(`
    SELECT sc.*, u.nickname AS challenger_name
    FROM settlement_challenges sc
    JOIN users u ON u.id = sc.challenger_id
    WHERE sc.item_id IN (SELECT id FROM settlement_items WHERE settlement_id = ?)
    ORDER BY sc.created_at DESC
  `).bind(settlementId).all()

  return c.json({ success: true, data: { ...settlement, items: items.results, challenges: challenges.results } })
})

// Confirm settlement (all items → confirmed)
settlements.post("/settlements/:id/confirm", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'pending'"
  ).bind(settlementId).first<{ house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run()

  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'confirmed' WHERE settlement_id = ? AND status = 'pending'"
  ).bind(settlementId).run()

  return c.json({ success: true, data: {} })
})

// Mark settlement as transferred
settlements.post("/settlements/:id/transfer", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'confirmed'"
  ).bind(settlementId).first<{ house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'transferred', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run()

  return c.json({ success: true, data: {} })
})

// Confirm a single settlement item
settlements.post("/settlements/:id/items/:itemId/confirm", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'pending'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'confirmed', version = version + 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(itemId).run()

  return c.json({ success: true, data: {} })
})

// Mark a single settlement item as transferred
settlements.post("/settlements/:id/items/:itemId/transfer", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'confirmed'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'transferred', version = version + 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(itemId).run()

  return c.json({ success: true, data: {} })
})
