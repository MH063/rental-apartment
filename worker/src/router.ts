import { Hono } from "hono"
import type { AppEnv } from "./types"
import { auth } from "./routes/auth"
import { houses } from "./routes/houses"
import { bills } from "./routes/bills"
import { settlements } from "./routes/settlements/index"
import { challenges } from "./routes/challenges"
import { stats } from "./routes/stats"
import { categories } from "./routes/categories"
import { templates } from "./routes/templates"
import { cronTasks } from "./routes/cron-tasks"
import { budget } from "./routes/budget"
import { budgetSuggestion } from "./routes/budget-suggestion"
import { ranking } from "./routes/ranking"
import { reports } from "./routes/reports"
import { payments } from "./routes/payments"
import { notify } from "./routes/notify"
import { notifications } from "./routes/notifications"
import { upload } from "./routes/upload"
import { seed } from "./routes/seed"

export function createRouter(env?: { ENVIRONMENT?: string }) {
  const app = new Hono<{ Bindings: AppEnv }>()

  app.route("/api", auth)
  app.route("/api", houses)
  app.route("/api", bills)
  app.route("/api", settlements)
  app.route("/api", challenges)
  app.route("/api", stats)
  app.route("/api", categories)
  app.route("/api", templates)
  app.route("/api", cronTasks)
  app.route("/api", budget)
  app.route("/api", budgetSuggestion)
  app.route("/api", ranking)
  app.route("/api", reports)
  app.route("/api", payments)
  app.route("/api", notify)
  app.route("/api", notifications)
  app.route("/api", upload)

  // Seed route only in non-production
  if (env?.ENVIRONMENT !== "production") app.route("/api", seed)

  return app
}

const app = createRouter()
export default app
