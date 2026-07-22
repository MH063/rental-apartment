import { Hono } from "hono"
import type { AppEnv } from "../types"

export const settlements = new Hono<{ Bindings: AppEnv }>()
settlements.get("/settlements", (c) => c.json({ success: true, data: [] }))
settlements.post("/settlements", (c) => c.json({ success: true, data: {} }))
settlements.get("/settlements/:id", (c) => c.json({ success: true, data: {} }))
