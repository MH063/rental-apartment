import { Hono } from "hono"
import type { AppEnv } from "../types"

export const seed = new Hono<{ Bindings: AppEnv }>()
seed.post("/seed/test-data", (c) => c.json({ success: true, data: { message: "not implemented" } }))
