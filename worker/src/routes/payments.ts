import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const payments = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
payments.use("*", authMiddleware)

payments.get("/payment-methods", async (c) => {
  const { userId } = c.var.user
  const list = await c.env.DB.prepare(
    "SELECT id, type, account, qr_code, is_default FROM payment_methods WHERE user_id = ?"
  ).bind(userId).all()
  return c.json({ success: true, data: list.results })
})

payments.post("/payment-methods", async (c) => {
  const { userId } = c.var.user
  const { type, account, qr_code } = await c.req.json<{ type: string; account: string; qr_code?: string }>()
  if (!type || !account) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const result = await c.env.DB.prepare(
    "INSERT INTO payment_methods (user_id, type, account, qr_code) VALUES (?, ?, ?, ?)"
  ).bind(userId, type, account, qr_code || null).run()

  const pm = await c.env.DB.prepare("SELECT id, type, account, qr_code, is_default FROM payment_methods WHERE id = ?")
    .bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: pm })
})

payments.put("/payment-methods/:id", async (c) => {
  const { userId } = c.var.user
  const id = Number(c.req.param("id"))
  const { type, account, is_default, qr_code } = await c.req.json<{ type?: string; account?: string; is_default?: number; qr_code?: string }>()

  await c.env.DB.prepare(
    "UPDATE payment_methods SET type = COALESCE(?, type), account = COALESCE(?, account), is_default = COALESCE(?, is_default), qr_code = COALESCE(?, qr_code) WHERE id = ? AND user_id = ?"
  ).bind(type ?? null, account ?? null, is_default ?? null, qr_code ?? null, id, userId).run()

  const pm = await c.env.DB.prepare("SELECT id, type, account, qr_code, is_default FROM payment_methods WHERE id = ?").bind(id).first()
  return c.json({ success: true, data: pm })
})

payments.delete("/payment-methods/:id", async (c) => {
  const { userId } = c.var.user
  await c.env.DB.prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?")
    .bind(Number(c.req.param("id")), userId).run()
  return c.json({ success: true, data: {} })
})
