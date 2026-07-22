import { Hono } from "hono"
import type { AppEnv } from "../types"

export const categories = new Hono<{ Bindings: AppEnv }>()
categories.get("/houses/:id/categories", (c) => c.json({ success: true, data: [] }))
categories.post("/houses/:id/categories", (c) => c.json({ success: true, data: {} }))
categories.put("/houses/:id/categories/:catId", (c) => c.json({ success: true, data: {} }))
categories.delete("/houses/:id/categories/:catId", (c) => c.json({ success: true, data: {} }))
