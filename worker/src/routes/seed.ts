import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const seed = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
seed.use("*", authMiddleware)

// 生成测试数据（仅开发环境可用，生产环境禁止调用）
seed.post("/seed/test-data", async (c) => {
  // 防止生产环境被任意用户调用污染数据库
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  const { userId } = c.var.user

  // Create house
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const houseResult = await c.env.DB.prepare(
    "INSERT INTO houses (name, address, invite_code, invite_code_expires_at, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).bind("测试合租屋", "测试地址", code, new Date(Date.now() + 7 * 86400000).toISOString(), userId).run()
  const houseId = Number(houseResult.meta.last_row_id)

  await c.env.DB.prepare("INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '寝室长')").bind(houseId, userId).run()

  // Create categories
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '房租', 1)").bind(houseId).run()
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '电费', 2)").bind(houseId).run()
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '水费', 3)").bind(houseId).run()

  return c.json({ success: true, data: { house_id: houseId, invite_code: code } })
})
