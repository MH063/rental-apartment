import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { requireHouseMember } from "../utils/authz"

export const stats = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
stats.use("*", authMiddleware)

// 月度趋势统计（需校验成员资格防止 IDOR）
// 字段统一为 total_amount，与 bills 表列名保持一致
stats.get("/houses/:id/stats/trend", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const rows = await c.env.DB.prepare(`
    SELECT strftime('%Y-%m', bill_date) as month, SUM(total_amount) as total_amount
    FROM bills WHERE house_id = ? AND status != '草稿'
      AND bill_date >= date('now', '-12 months')
    GROUP BY month ORDER BY month
  `).bind(houseId).all()
  return c.json({ success: true, data: rows.results })
})

// 分类统计（需校验成员资格防止 IDOR）
// 字段统一为 total_amount，与 bills 表列名保持一致
stats.get("/houses/:id/stats/category", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const rows = await c.env.DB.prepare(`
    SELECT c.name, SUM(b.total_amount) as total_amount
    FROM bills b JOIN categories c ON c.id = b.category_id
    WHERE b.house_id = ? AND b.status != '草稿'
      AND b.bill_date >= date('now', '-1 month')
    GROUP BY c.id ORDER BY total_amount DESC
  `).bind(houseId).all()
  return c.json({ success: true, data: rows.results })
})

// 年度对比统计（需校验成员资格防止 IDOR）
stats.get("/houses/:id/stats/yearly", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await requireHouseMember(c.env.DB, houseId, userId)
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const thisYear = String(new Date().getFullYear())
  const lastYear = String(new Date().getFullYear() - 1)

  const rows = await c.env.DB.prepare(`
    SELECT strftime('%m', bill_date) as month,
      SUM(CASE WHEN strftime('%Y', bill_date) = ? THEN total_amount ELSE 0 END) as this_year,
      SUM(CASE WHEN strftime('%Y', bill_date) = ? THEN total_amount ELSE 0 END) as last_year
    FROM bills WHERE house_id = ? AND status != '草稿'
      AND bill_date >= ? || '-01-01' AND bill_date <= ? || '-12-31'
    GROUP BY month ORDER BY month
  `).bind(thisYear, lastYear, houseId, thisYear, lastYear).all()

  return c.json({ success: true, data: rows.results })
})
