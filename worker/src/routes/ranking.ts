import { Hono } from "hono"
import type { AppEnv } from "../types"

export const ranking = new Hono<{ Bindings: AppEnv }>()
ranking.get("/houses/:id/ranking", (c) => c.json({ success: true, data: [] }))
