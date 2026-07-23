import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const templates = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
templates.use("*", authMiddleware)

// 查询账单模板列表（需校验成员资格防止 IDOR）
templates.get("/bill-templates", async (c) => {
  const { userId } = c.var.user
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await requireHouseMember(c.env.DB, Number(houseId), userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare(
    "SELECT * FROM bill_templates WHERE house_id = ? ORDER BY created_at DESC"
  ).bind(Number(houseId)).all()
  return c.json({ success: true, data: list.results })
})

// 新建账单模板（需校验成员资格防止 IDOR）
templates.post("/bill-templates", async (c) => {
  const { userId } = c.var.user
  const { house_id, title, amount, category_id, split_type, cron_expr } = await c.req.json<{
    house_id: number; title: string; amount: number; category_id?: number; split_type?: string; cron_expr: string
  }>()
  if (!house_id || !title || !amount || !cron_expr) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await requireHouseMember(c.env.DB, Number(house_id), userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const result = await c.env.DB.prepare(`
    INSERT INTO bill_templates (house_id, title, amount, category_id, split_type, cron_expr)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(house_id, title, amount, category_id ?? null, split_type ?? '均摊', cron_expr).run()

  const tpl = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: tpl })
})

// 更新账单模板（需校验成员资格防止 IDOR）
templates.put("/bill-templates/:id", async (c) => {
  const { userId } = c.var.user
  const id = Number(c.req.param("id"))
  const body = await c.req.json<{ title?: string; amount?: number; enabled?: number }>()

  // 先查询模板获取 house_id 用于成员校验
  const tpl = await c.env.DB.prepare("SELECT house_id FROM bill_templates WHERE id = ?").bind(id).first<{ house_id: number }>()
  if (!tpl) return c.json({ success: false, error: "ERR_COMMON_NOT_FOUND" }, 404)

  const member = await requireHouseMember(c.env.DB, tpl.house_id, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(`
    UPDATE bill_templates SET title = COALESCE(?, title), amount = COALESCE(?, amount),
      enabled = COALESCE(?, enabled), updated_at = datetime('now') WHERE id = ?
  `).bind(body.title ?? null, body.amount ?? null, body.enabled ?? null, id).run()

  const updated = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(id).first()
  return c.json({ success: true, data: updated })
})

// 删除账单模板（需校验成员资格防止 IDOR）
templates.delete("/bill-templates/:id", async (c) => {
  const { userId } = c.var.user
  const id = Number(c.req.param("id"))

  // 先查询模板获取 house_id 用于成员校验
  const tpl = await c.env.DB.prepare("SELECT house_id FROM bill_templates WHERE id = ?").bind(id).first<{ house_id: number }>()
  if (!tpl) return c.json({ success: false, error: "ERR_COMMON_NOT_FOUND" }, 404)

  const member = await requireHouseMember(c.env.DB, tpl.house_id, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare("DELETE FROM bill_templates WHERE id = ?").bind(id).run()
  return c.json({ success: true, data: {} })
})
