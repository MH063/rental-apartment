import { Hono } from "hono"
import type { AppEnv } from "../types"

export const notify = new Hono<{ Bindings: AppEnv }>()
notify.post("/notify/subscribe", (c) => c.json({ success: true, data: {} }))
