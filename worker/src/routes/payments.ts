import { Hono } from "hono"
import type { AppEnv } from "../types"

export const payments = new Hono<{ Bindings: AppEnv }>()
payments.get("/payment-methods", (c) => c.json({ success: true, data: [] }))
payments.post("/payment-methods", (c) => c.json({ success: true, data: {} }))
payments.put("/payment-methods/:id", (c) => c.json({ success: true, data: {} }))
payments.delete("/payment-methods/:id", (c) => c.json({ success: true, data: {} }))
