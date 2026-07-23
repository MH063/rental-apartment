import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const budget = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
budget.use("*", authMiddleware)

// 查询合租屋预算（需校验成员资格防止 IDOR）
budget.get("/houses/:id/budget", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const key = `budget:${c.req.param("id")}`
  const raw = await c.env.KV.get(key)
  return c.json({ success: true, data: raw ? JSON.parse(raw) : {} })
})

// 保存合租屋预算（需校验成员资格防止 IDOR）
budget.post("/houses/:id/budget", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const key = `budget:${c.req.param("id")}`
  const data = await c.req.json()
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 365 * 86400 })
  return c.json({ success: true, data: {} })
})
