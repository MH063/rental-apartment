import { Hono } from "hono"
import type { AppEnv } from "../types"

export const budget = new Hono<{ Bindings: AppEnv }>()
budget.get("/houses/:id/budget", (c) => c.json({ success: true, data: {} }))
budget.post("/houses/:id/budget", (c) => c.json({ success: true, data: {} }))
budget.put("/houses/:id/budget", (c) => c.json({ success: true, data: {} }))
