import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const notifications = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
notifications.use("*", authMiddleware)

notifications.get("/notifications", async (c) => {
  const { userId } = c.var.user
  const key = `notifications:${userId}`
  const raw = await c.env.KV.get(key)
  const items = raw ? JSON.parse(raw) : []
  return c.json({ success: true, data: items })
})

notifications.post("/notifications/read", async (c) => {
  return c.json({ success: true, data: {} })
})
