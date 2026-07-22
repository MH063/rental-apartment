import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const stats = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
stats.use("*", authMiddleware)

stats.get("/houses/:id/stats/trend", async (c) => {
  const houseId = Number(c.req.param("id"))
  const rows = await c.env.DB.prepare(`
    SELECT strftime('%Y-%m', bill_date) as month, SUM(total_amount) as total
    FROM bills WHERE house_id = ? AND status != '草稿'
      AND bill_date >= date('now', '-12 months')
    GROUP BY month ORDER BY month
  `).bind(houseId).all()
  return c.json({ success: true, data: rows.results })
})

stats.get("/houses/:id/stats/category", async (c) => {
  const houseId = Number(c.req.param("id"))
  const rows = await c.env.DB.prepare(`
    SELECT c.name, SUM(b.total_amount) as total
    FROM bills b JOIN categories c ON c.id = b.category_id
    WHERE b.house_id = ? AND b.status != '草稿'
      AND b.bill_date >= date('now', '-1 month')
    GROUP BY c.id ORDER BY total DESC
  `).bind(houseId).all()
  return c.json({ success: true, data: rows.results })
})

stats.get("/houses/:id/stats/yearly", async (c) => {
  const houseId = Number(c.req.param("id"))
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
