import { Hono } from "hono"
import type { AppEnv } from "../types"

export const budgetSuggestion = new Hono<{ Bindings: AppEnv }>()
budgetSuggestion.get("/houses/:id/budget-suggestion", (c) => c.json({ success: true, data: {} }))
