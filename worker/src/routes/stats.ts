import { Hono } from "hono"
import type { AppEnv } from "../types"

export const stats = new Hono<{ Bindings: AppEnv }>()
stats.get("/houses/:id/stats/trend", (c) => c.json({ success: true, data: {} }))
stats.get("/houses/:id/stats/category", (c) => c.json({ success: true, data: {} }))
stats.get("/houses/:id/stats/yearly", (c) => c.json({ success: true, data: {} }))
