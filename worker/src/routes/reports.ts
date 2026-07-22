import { Hono } from "hono"
import type { AppEnv } from "../types"

export const reports = new Hono<{ Bindings: AppEnv }>()
reports.get("/houses/:id/reports", (c) => c.json({ success: true, data: {} }))
