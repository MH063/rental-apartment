import { Hono } from "hono"
import type { AppEnv } from "../types"

export const templates = new Hono<{ Bindings: AppEnv }>()
templates.get("/bill-templates", (c) => c.json({ success: true, data: [] }))
templates.post("/bill-templates", (c) => c.json({ success: true, data: {} }))
templates.put("/bill-templates/:id", (c) => c.json({ success: true, data: {} }))
templates.delete("/bill-templates/:id", (c) => c.json({ success: true, data: {} }))
