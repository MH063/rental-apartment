import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const cronTasks = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
cronTasks.use("*", authMiddleware)

cronTasks.get("/cron-tasks", async (c) => {
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const list = await c.env.DB.prepare(
    "SELECT * FROM cron_tasks WHERE house_id = ? ORDER BY next_run_at"
  ).bind(Number(houseId)).all()
  return c.json({ success: true, data: list.results })
})
