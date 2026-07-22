import { Hono } from "hono"
import type { AppEnv } from "../types"

export const houses = new Hono<{ Bindings: AppEnv }>()
houses.get("/houses", (c) => c.json({ success: true, data: [] }))
houses.post("/houses", (c) => c.json({ success: true, data: {} }))
houses.get("/houses/:id", (c) => c.json({ success: true, data: {} }))
houses.put("/houses/:id", (c) => c.json({ success: true, data: {} }))
houses.delete("/houses/:id", (c) => c.json({ success: true, data: {} }))
houses.get("/user/houses", (c) => c.json({ success: true, data: [] }))
