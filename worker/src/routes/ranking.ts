import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const ranking = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
ranking.use("*", authMiddleware)

// 消费排行榜（需校验成员资格防止 IDOR）
// 字段统一为 total_amount，与 bills/stats 保持一致
ranking.get("/houses/:id/ranking", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const startDate = c.req.query("start_date")
  const endDate = c.req.query("end_date")

  let sql = `
    SELECT u.id, u.nickname, u.avatar, SUM(s.amount) as total_amount
    FROM splits s
    JOIN bills b ON b.id = s.bill_id
    JOIN users u ON u.id = s.user_id
    WHERE b.house_id = ? AND b.status != '草稿'
  `
  const params: unknown[] = [houseId]
  if (startDate) { sql += " AND b.bill_date >= ?"; params.push(startDate) }
  if (endDate) { sql += " AND b.bill_date <= ?"; params.push(endDate) }

  sql += " GROUP BY s.user_id ORDER BY total_amount DESC"

  const rows = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json({ success: true, data: rows.results })
})
