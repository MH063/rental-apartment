import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../../types"
import { authMiddleware } from "../../middleware/auth"

export const read = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
read.use("*", authMiddleware)

read.get("/settlements", async (c) => {
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

read.get("/settlements/:id", async (c) => {
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
