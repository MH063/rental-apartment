import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const budget = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
budget.use("*", authMiddleware)

budget.get("/houses/:id/budget", async (c) => {
  const key = `budget:${c.req.param("id")}`
  const raw = await c.env.KV.get(key)
  return c.json({ success: true, data: raw ? JSON.parse(raw) : {} })
})

budget.post("/houses/:id/budget", async (c) => {
  const key = `budget:${c.req.param("id")}`
  const data = await c.req.json()
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 365 * 86400 })
  return c.json({ success: true, data: {} })
})
