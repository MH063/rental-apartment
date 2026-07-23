import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const cronTasks = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
cronTasks.use("*", authMiddleware)

// 查询定时任务列表（需校验成员资格防止 IDOR）
cronTasks.get("/cron-tasks", async (c) => {
  const { userId } = c.var.user
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await requireHouseMember(c.env.DB, Number(houseId), userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare(
    "SELECT * FROM cron_tasks WHERE house_id = ? ORDER BY next_run_at"
  ).bind(Number(houseId)).all()
  return c.json({ success: true, data: list.results })
})
