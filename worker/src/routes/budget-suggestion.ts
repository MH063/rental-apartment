import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const budgetSuggestion = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
budgetSuggestion.use("*", authMiddleware)

budgetSuggestion.get("/houses/:id/budget-suggestion", async (c) => {
  const houseId = Number(c.req.param("id"))

  const rows = await c.env.DB.prepare(`
    SELECT category_id, AVG(total_amount) as avg_amount FROM bills
    WHERE house_id = ? AND status != '草稿'
      AND bill_date >= date('now', '-3 months')
    GROUP BY category_id
  `).bind(houseId).all()

  return c.json({ success: true, data: rows.results })
})
