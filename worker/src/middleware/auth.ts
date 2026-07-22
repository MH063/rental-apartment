import type { Context, Next } from "hono"
import { verify } from "../utils/jwt"

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.req.header("Authorization")
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_INVALID" }, 401)
  }

  const token = auth.slice(7)
  const payload = await verify(token, c.env.JWT_SECRET)

  if (!payload) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_EXPIRED" }, 401)
  }

  c.set("user", { userId: payload.userId as number, openid: payload.openid as string })
  await next()
}
