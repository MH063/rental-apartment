import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const templates = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
templates.use("*", authMiddleware)

templates.get("/bill-templates", async (c) => {
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const list = await c.env.DB.prepare(
    "SELECT * FROM bill_templates WHERE house_id = ? ORDER BY created_at DESC"
  ).bind(Number(houseId)).all()
  return c.json({ success: true, data: list.results })
})

templates.post("/bill-templates", async (c) => {
  const { house_id, title, amount, category_id, split_type, cron_expr } = await c.req.json<{
    house_id: number; title: string; amount: number; category_id?: number; split_type?: string; cron_expr: string
  }>()
  if (!house_id || !title || !amount || !cron_expr) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const result = await c.env.DB.prepare(`
    INSERT INTO bill_templates (house_id, title, amount, category_id, split_type, cron_expr)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(house_id, title, amount, category_id ?? null, split_type ?? '均摊', cron_expr).run()

  const tpl = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: tpl })
})

templates.put("/bill-templates/:id", async (c) => {
  const id = Number(c.req.param("id"))
  const body = await c.req.json<{ title?: string; amount?: number; enabled?: number }>()

  await c.env.DB.prepare(`
    UPDATE bill_templates SET title = COALESCE(?, title), amount = COALESCE(?, amount),
      enabled = COALESCE(?, enabled), updated_at = datetime('now') WHERE id = ?
  `).bind(body.title ?? null, body.amount ?? null, body.enabled ?? null, id).run()

  const tpl = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(id).first()
  return c.json({ success: true, data: tpl })
})

templates.delete("/bill-templates/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM bill_templates WHERE id = ?").bind(Number(c.req.param("id"))).run()
  return c.json({ success: true, data: {} })
})
