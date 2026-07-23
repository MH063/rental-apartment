import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

interface NotificationItem {
  id: string
  title: string
  content: string
  created_at: string
  read?: boolean
}

export const notifications = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()
notifications.use("*", authMiddleware)

// 查询当前用户的通知列表
notifications.get("/notifications", async (c) => {
  const { userId } = c.var.user
  const key = `notifications:${userId}`
  const raw = await c.env.KV.get(key)
  const items: NotificationItem[] = raw ? JSON.parse(raw) : []
  return c.json({ success: true, data: items })
})

// 将指定通知标记为已读（实现真实的 KV 更新）
// 兼容前端不传 body 或传空对象的情况
notifications.post("/notifications/read", async (c) => {
  const { userId } = c.var.user
  const key = `notifications:${userId}`

  // 安全读取请求 body：空 body 时默认为 {}
  let body: { id?: string } = {}
  try {
    const rawBody = await c.req.json()
    if (rawBody && typeof rawBody === "object") {
      body = rawBody as { id?: string }
    }
  } catch (e) {
    // 空 body 或解析失败时按默认空对象处理
    body = {}
  }
  const { id } = body

  const raw = await c.env.KV.get(key)
  const items: NotificationItem[] = raw ? JSON.parse(raw) : []

  if (items.length === 0) {
    return c.json({ success: true, data: {} })
  }

  if (id) {
    const target = items.find((it) => it.id === id)
    if (target) target.read = true
  } else {
    items.forEach((it) => { it.read = true })
  }

  await c.env.KV.put(key, JSON.stringify(items), { expirationTtl: 30 * 86400 })
  return c.json({ success: true, data: {} })
})
