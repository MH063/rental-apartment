import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { sign } from "../utils/jwt"
import { createWechatAPI } from "../services/wechat"
import { authMiddleware } from "../middleware/auth"

export const auth = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

auth.post("/auth/login", async (c) => {
  const { code } = await c.req.json<{ code: string }>()
  if (!code) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  let openid: string

  if (c.env.ENVIRONMENT === 'development') {
    openid = `dev_${code}`
  } else {
    const wechat = createWechatAPI(c.env)
    const session = await wechat.code2Session(code)
    if (!session.openid) {
      return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401)
    }
    openid = session.openid
  }

  let user = await c.env.DB.prepare("SELECT id FROM users WHERE wechat_openid = ?").bind(openid).first<{ id: number }>()

  if (!user) {
    const result = await c.env.DB.prepare("INSERT INTO users (wechat_openid, nickname) VALUES (?, ?)").bind(openid, "").run()
    user = { id: Number(result.meta.last_row_id) }
  }

  const accessToken = await sign({ userId: user.id, openid }, c.env.JWT_SECRET, 7200)
  const refreshToken = await sign({ userId: user.id, openid, type: "refresh" }, c.env.JWT_SECRET, 2592000)

  await c.env.KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 2592000 })

  // Store refresh token family for revocation tracking
  const tokenFamily = crypto.randomUUID()
  await c.env.KV.put(`refresh:${user.id}`, JSON.stringify({ token: refreshToken, family: tokenFamily }), { expirationTtl: 2592000 })

  return c.json({ success: true, data: { access_token: accessToken, refresh_token: refreshToken, user_id: user.id, token_family: tokenFamily } })
})

auth.post("/auth/refresh", async (c) => {
  const { refresh_token } = await c.req.json<{ refresh_token: string }>()
  if (!refresh_token) {
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401)
  }

  const { verify } = await import("../utils/jwt")
  const payload = await verify(refresh_token, c.env.JWT_SECRET)
  if (!payload || payload.type !== "refresh") {
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401)
  }

  const userId = payload.userId as number

  const storedRaw = await c.env.KV.get(`refresh:${userId}`)
  if (!storedRaw) return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401)

  const stored = JSON.parse(storedRaw)
  if (stored.token !== refresh_token) {
    // Token reuse detected — revoke entire family
    await c.env.KV.delete(`refresh:${userId}`)
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401)
  }

  await c.env.KV.delete(`refresh:${userId}`)

  const accessToken = await sign({ userId, openid: payload.openid }, c.env.JWT_SECRET, 7200)
  const newRefreshToken = await sign({ userId, openid: payload.openid, type: "refresh" }, c.env.JWT_SECRET, 2592000)

  await c.env.KV.put(`refresh:${userId}`, JSON.stringify({ token: newRefreshToken, family: stored.family }), { expirationTtl: 2592000 })

  return c.json({ success: true, data: { access_token: accessToken, refresh_token: newRefreshToken } })
})

auth.post("/auth/logout", authMiddleware, async (c) => {
  const { userId } = c.var.user
  await c.env.KV.delete(`refresh:${userId}`)
  return c.json({ success: true, data: {} })
})

auth.get("/user/profile", authMiddleware, async (c) => {
  const { userId } = c.var.user

  const user = await c.env.DB.prepare("SELECT id, nickname, avatar, created_at FROM users WHERE id = ?").bind(userId).first()

  if (!user) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_INVALID" }, 404)
  }

  return c.json({ success: true, data: user })
})

auth.put("/user/profile", authMiddleware, async (c) => {
  const { userId } = c.var.user
  const { nickname, avatar } = await c.req.json<{ nickname?: string; avatar?: string }>()

  await c.env.DB.prepare("UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), updated_at = datetime('now') WHERE id = ?")
    .bind(nickname || null, avatar || null, userId).run()

  return c.json({ success: true, data: {} })
})
