import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const notify = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
notify.use("*", authMiddleware)

notify.post("/notify/subscribe", async (c) => {
  const { userId } = c.var.user
  const { template_id, subscribe } = await c.req.json<{ template_id: string; subscribe: boolean }>()
  const key = `subscribe:${userId}:${template_id}`
  if (subscribe) {
    await c.env.KV.put(key, "1", { expirationTtl: 365 * 86400 })
  } else {
    await c.env.KV.delete(key)
  }
  return c.json({ success: true, data: {} })
})
