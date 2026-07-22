import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../../types"
import { authMiddleware } from "../../middleware/auth"

export const actions = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
actions.use("*", authMiddleware)

actions.post("/settlements/:id/confirm", async (c) => {
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

actions.post("/settlements/:id/transfer", async (c) => {
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

actions.post("/settlements/:id/items/:itemId/confirm", async (c) => {
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

actions.post("/settlements/:id/items/:itemId/transfer", async (c) => {
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
