import { Hono } from "hono"
import type { AppEnv } from "../types"

export const bills = new Hono<{ Bindings: AppEnv }>()
bills.get("/bills", (c) => c.json({ success: true, data: [] }))
bills.post("/bills", (c) => c.json({ success: true, data: {} }))
bills.get("/bills/:id", (c) => c.json({ success: true, data: {} }))
bills.put("/bills/:id", (c) => c.json({ success: true, data: {} }))
bills.delete("/bills/:id", (c) => c.json({ success: true, data: {} }))
bills.post("/r2/upload", (c) => c.json({ success: true, data: {} }))
