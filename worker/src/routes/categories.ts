import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const categories = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
categories.use("*", authMiddleware)

// 查询合租屋所有类目（需校验成员资格防止 IDOR）
categories.get("/houses/:id/categories", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare("SELECT * FROM categories WHERE house_id = ? ORDER BY sort_order").bind(houseId).all()
  return c.json({ success: true, data: list.results })
})

// 新增类目（需校验成员资格防止 IDOR）
categories.post("/houses/:id/categories", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const { name } = await c.req.json<{ name: string }>()
  if (!name) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const max = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE house_id = ?").bind(houseId).first<{ next: number }>()
  const result = await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, ?, ?)").bind(houseId, name, max?.next ?? 1).run()

  const cat = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: cat })
})

// 更新类目（需校验成员资格防止 IDOR）
categories.put("/houses/:id/categories/:catId", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const catId = Number(c.req.param("catId"))
  const { name, sort_order } = await c.req.json<{ name?: string; sort_order?: number }>()

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare("UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?")
    .bind(name ?? null, sort_order ?? null, catId).run()
  const cat = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(catId).first()
  return c.json({ success: true, data: cat })
})

// 删除类目（需校验成员资格防止 IDOR）
categories.delete("/houses/:id/categories/:catId", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const catId = Number(c.req.param("catId"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run()
  return c.json({ success: true, data: {} })
})
