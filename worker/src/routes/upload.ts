import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"

export const upload = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

// POST 需要登录
upload.use("/upload", authMiddleware)

upload.post("/upload", async (c) => {
  try {
    const body = await c.req.json<{ image: string; filename?: string }>()
    if (!body.image) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

    const prefix = (body.filename || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '')
    const key = `houses/${Date.now()}-${prefix}`

    const raw = body.image.replace(/^data:image\/\w+;base64,/, '')
    const binary = atob(raw)
    const uint8 = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i)

    await c.env.R2.put(key, uint8, {
      httpMetadata: { contentType: 'image/jpeg' },
    })

    return c.json({ success: true, data: { url: `/api/uploads/${key}` } })
  } catch (e) {
    return c.json({ success: false, error: "图片上传失败" }, 500)
  }
})

// GET 不需要登录（供 <image> 直接加载）
upload.get("/uploads/*", async (c) => {
  const key = c.req.param("*")
  if (!key) return c.json({ success: false, error: "ERR_COMMON_NOT_FOUND" }, 404)
  const obj = await c.env.R2.get(key)
  if (!obj) return c.json({ success: false, error: "ERR_COMMON_NOT_FOUND" }, 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set("etag", obj.httpEtag)
  return new Response(obj.body, { headers })
})
