import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const reports = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
reports.use("*", authMiddleware)

// 自定义报表（需校验成员资格防止 IDOR）
reports.get("/houses/:id/reports", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const startDate = c.req.query("start_date") ?? dateMonthsAgo(3)
  const endDate = c.req.query("end_date") ?? today()

  const bills = await c.env.DB.prepare(`
    SELECT b.*, c.name as category_name, GROUP_CONCAT(s.user_id || ':' || s.amount) as split_detail
    FROM bills b
    LEFT JOIN categories c ON c.id = b.category_id
    LEFT JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND b.bill_date >= ? AND b.bill_date <= ?
    GROUP BY b.id ORDER BY b.bill_date DESC
  `).bind(houseId, startDate, endDate).all()

  return c.json({ success: true, data: bills.results })
})

function today(): string { return new Date().toISOString().slice(0, 10) }
function dateMonthsAgo(n: number): string {
  const d = new Date(); d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 10)
}
