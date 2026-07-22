import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../../types"
import { authMiddleware } from "../../middleware/auth"
import { read } from "./read"
import { create } from "./create"
import { actions } from "./actions"

export const settlements = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
settlements.use("*", authMiddleware)
settlements.route("/", read)
settlements.route("/", create)
settlements.route("/", actions)
