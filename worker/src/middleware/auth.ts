import type { Context, Next } from "hono"

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.req.header("Authorization")
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_INVALID" }, 401)
  }
  await next()
}
