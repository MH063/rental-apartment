import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const upload = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

upload.use("*", authMiddleware)

upload.post("/upload", async (c) => {
  const body = await c.req.json<{ image: string; filename?: string }>()
  if (!body.image) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const prefix = body.filename?.replace(/[^a-zA-Z0-9._-]/g, '') || 'photo.jpg'
  const key = `houses/${Date.now()}-${prefix}`

  const base64 = body.image.replace(/^data:image\/\w+;base64,/, '')
  const uint8 = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  await c.env.R2.put(key, uint8, {
    httpMetadata: { contentType: 'image/jpeg' },
  })

  return c.json({ success: true, data: { url: key } })
})
