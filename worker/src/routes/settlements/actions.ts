import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../../types"
import { authMiddleware } from "../../middleware/auth"

export const actions = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
actions.use("*", authMiddleware)

async function updateItemWithLock(db: D1Database, itemId: number, version: number, updates: Record<string, unknown>): Promise<boolean> {
  const setClauses: string[] = ["version = version + 1", "updated_at = datetime('now')"]
  const params: unknown[] = []
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = ?`)
    params.push(value)
  }
  params.push(itemId, version)
  const result = await db.prepare(
    `UPDATE settlement_items SET ${setClauses.join(", ")} WHERE id = ? AND version = ?`
  ).bind(...params).run()
  return (result.meta.changes ?? 0) > 0
}

actions.post("/settlements/:id/confirm", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'active'"
  ).bind(settlementId).first<{ house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run()
  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'confirmed', version = version + 1, updated_at = datetime('now') WHERE settlement_id = ? AND status = 'pending'"
  ).bind(settlementId).run()

  return c.json({ success: true, data: {} })
})

actions.post("/settlements/:id/transfer", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'active'"
  ).bind(settlementId).first<{ house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run()

  return c.json({ success: true, data: {} })
})

actions.post("/settlements/:id/items/:itemId/confirm", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id, s.status AS settlement_status FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'pending'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number; version: number; settlement_status: string }>()
  if (!item || item.settlement_status !== 'active') return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: 'confirmed' })
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409)

  return c.json({ success: true, data: {} })
})

actions.post("/settlements/:id/items/:itemId/transfer", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id, s.status AS settlement_status FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'confirmed'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number; final_amount: number; paid_amount: number; version: number; settlement_status: string }>()
  if (!item || item.settlement_status !== 'active') return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  if ((Number(item.paid_amount) || 0) < Number(item.final_amount)) {
    return c.json({ success: false, error: "ERR_SETTLE_NOT_PAID" }, 400)
  }

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: 'transferred' })
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409)

  return c.json({ success: true, data: {} })
})

// === P1-02: partial_payments ===

actions.post("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))
  const { amount, note, voucher } = await c.req.json<{ amount: number; note?: string; voucher?: string }>()
  if (!amount || amount <= 0) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number; final_amount: number; paid_amount: number; version: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  if (item.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const remaining = Number(item.final_amount) - (Number(item.paid_amount) || 0)
  if (amount > remaining) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const result = await c.env.DB.prepare(`
    INSERT INTO partial_payments (item_id, payer_id, amount, note, voucher)
    VALUES (?, ?, ?, ?, ?)
  `).bind(itemId, userId, amount, note || null, voucher || null).run()

  const newPaid = (Number(item.paid_amount) || 0) + amount
  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { paid_amount: newPaid })
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409)

  const pp = await c.env.DB.prepare("SELECT * FROM partial_payments WHERE id = ?").bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: pp })
})

actions.get("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.id, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first<{ id: number; house_id: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare(`
    SELECT pp.*, u.nickname AS payer_name FROM partial_payments pp
    JOIN users u ON u.id = pp.payer_id
    WHERE pp.item_id = ? ORDER BY pp.created_at DESC
  `).bind(itemId).all()

  return c.json({ success: true, data: list.results })
})

actions.delete("/settlements/:id/items/:itemId/partial-payments/:pid", async (c) => {
  const { userId } = c.var.user
  const pid = Number(c.req.param("pid"))
  const itemId = Number(c.req.param("itemId"))

  const pp = await c.env.DB.prepare(`
    SELECT pp.*, si.version AS item_version FROM partial_payments pp
    JOIN settlement_items si ON si.id = pp.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE pp.id = ? AND pp.item_id = ?
  `).bind(pid, itemId).first<{ id: number; payer_id: number; amount: number; item_version: number }>()
  if (!pp) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 404)

  if (pp.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare("DELETE FROM partial_payments WHERE id = ?").bind(pid).run()

  const sum = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM partial_payments WHERE item_id = ?"
  ).bind(itemId).first<{ total: number }>()
  const ok = await updateItemWithLock(c.env.DB, itemId, pp.item_version, { paid_amount: sum?.total ?? 0 })
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409)

  return c.json({ success: true, data: {} })
})

// === P1-03: Undo ===

actions.post("/settlements/:id/undo", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'closed'"
  ).bind(settlementId).first<{ id: number; house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const items = await c.env.DB.prepare(
    "SELECT id FROM settlement_items WHERE settlement_id = ?"
  ).bind(settlementId).all<{ id: number }>()

  try {
    for (const item of items.results) {
      await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(item.id).run()
      await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(item.id).run()
    }
    await c.env.DB.prepare("DELETE FROM settlement_items WHERE settlement_id = ?").bind(settlementId).run()
    await c.env.DB.prepare(
      "UPDATE settlements SET status = 'active', updated_at = datetime('now') WHERE id = ?"
    ).bind(settlementId).run()

    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement', 'settlements', ?)
    `).bind(settlement.house_id, userId, settlementId).run()

    return c.json({ success: true, data: { id: settlementId, status: 'active' } })
  } catch {
    await c.env.DB.prepare(
      "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
    ).bind(settlementId).run()
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500)
  }
})

actions.post("/settlements/:id/items/:itemId/undo", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first<{ id: number; house_id: number; status: string; version: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)
  if (item.status === 'pending') return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  try {
    await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(itemId).run()
    await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(itemId).run()
    const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: 'pending', paid_amount: 0 })
    if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409)

    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement_item', 'settlement_items', ?)
    `).bind(item.house_id, userId, itemId).run()

    return c.json({ success: true, data: { id: itemId, status: 'pending' } })
  } catch {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500)
  }
})
