import { Hono } from "hono"
import type { AppEnv } from "../types"

export const cronTasks = new Hono<{ Bindings: AppEnv }>()
cronTasks.get("/cron-tasks", (c) => c.json({ success: true, data: [] }))
