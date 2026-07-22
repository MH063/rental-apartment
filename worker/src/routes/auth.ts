import { Hono } from "hono"
import type { AppEnv } from "../types"

export const auth = new Hono<{ Bindings: AppEnv }>()

auth.post("/auth/login", async (c) => {
  return c.json({ success: true, data: { message: "not implemented" } })
})

auth.post("/auth/refresh", async (c) => {
  return c.json({ success: true, data: { message: "not implemented" } })
})

auth.get("/user/profile", async (c) => {
  return c.json({ success: true, data: { message: "not implemented" } })
})
