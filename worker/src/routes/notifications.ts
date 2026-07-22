import { Hono } from "hono"
import type { AppEnv } from "../types"

export const notifications = new Hono<{ Bindings: AppEnv }>()
notifications.get("/notifications", (c) => c.json({ success: true, data: [] }))
notifications.post("/notifications/read", (c) => c.json({ success: true, data: {} }))
