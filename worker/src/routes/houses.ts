import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { generateInviteCode, inviteCodeExpiresAt, isExpired } from "../utils/invite"
import { hasMinRole } from "../utils/role"

export const houses = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

// Apply auth to all routes
houses.use("*", authMiddleware)

// Create house
houses.post("/houses", async (c) => {
  const { userId } = c.var.user
  const { name, address } = await c.req.json<{ name: string; address?: string }>()
  if (!name) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const inviteCode = generateInviteCode()
  const expiresAt = inviteCodeExpiresAt()

  const result = await c.env.DB.prepare(
    "INSERT INTO houses (name, address, invite_code, invite_code_expires_at, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(name, address || "", inviteCode, expiresAt, userId).run()

  const houseId = Number(result.meta.last_row_id)

  await c.env.DB.prepare(
    "INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '寝室长')"
  ).bind(houseId, userId).run()

  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first()
  return c.json({ success: true, data: house })
})

// List user's houses
houses.get("/houses", async (c) => {
  const { userId } = c.var.user
  const list = await c.env.DB.prepare(`
    SELECT h.* FROM houses h
    JOIN members m ON m.house_id = h.id
    WHERE m.user_id = ? AND m.status = 'active'
  `).bind(userId).all()
  return c.json({ success: true, data: list.results })
})

houses.get("/user/houses", async (c) => {
  const { userId } = c.var.user
  const list = await c.env.DB.prepare(`
    SELECT h.*, m.role FROM houses h
    JOIN members m ON m.house_id = h.id
    WHERE m.user_id = ? AND m.status = 'active'
  `).bind(userId).all()
  return c.json({ success: true, data: list.results })
})

// Get single house
houses.get("/houses/:id", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first()
  return c.json({ success: true, data: house })
})

// Update house (dorm leader only)
houses.put("/houses/:id", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const { name, address } = await c.req.json<{ name?: string; address?: string }>()

  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first<{ role: string }>()
  if (!member || !hasMinRole(member.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  await c.env.DB.prepare(
    "UPDATE houses SET name = COALESCE(?, name), address = COALESCE(?, address), updated_at = datetime('now') WHERE id = ?"
  ).bind(name || null, address || null, houseId).run()

  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first()
  return c.json({ success: true, data: house })
})

// Delete house (dorm leader only)
houses.delete("/houses/:id", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first<{ role: string }>()
  if (!member || !hasMinRole(member.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  await c.env.DB.prepare("DELETE FROM houses WHERE id = ?").bind(houseId).run()
  return c.json({ success: true, data: {} })
})

// ---- Members ----

// List members
houses.get("/houses/:id/members", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const members = await c.env.DB.prepare(`
    SELECT m.id, m.user_id, m.role, m.joined_at, u.nickname, u.avatar
    FROM members m JOIN users u ON u.id = m.user_id
    WHERE m.house_id = ? AND m.status = 'active'
    ORDER BY m.joined_at
  `).bind(houseId).all()

  return c.json({ success: true, data: members.results })
})

// Join house with invite code
houses.post("/houses/:id/join", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const { code } = await c.req.json<{ code: string }>()

  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first<{
    invite_code: string
    invite_code_expires_at: string
  }>()
  if (!house) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404)

  if (house.invite_code !== code) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  if (isExpired(house.invite_code_expires_at)) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM members WHERE house_id = ? AND user_id = ?"
  ).bind(houseId, userId).first<{ id: number; status: string }>()

  if (existing) {
    if (existing.status === "active") {
      return c.json({ success: false, error: "ERR_BILL_DUPLICATE" }, 400)
    }
    await c.env.DB.prepare("UPDATE members SET status = 'active', left_at = NULL WHERE id = ?").bind(existing.id).run()
  } else {
    await c.env.DB.prepare(
      "INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '普通成员')"
    ).bind(houseId, userId).run()
  }

  return c.json({ success: true, data: {} })
})

// Leave house
houses.post("/houses/:id/leave", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT id, role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first<{ id: number; role: string }>()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare(
    "UPDATE members SET status = 'left', left_at = datetime('now') WHERE id = ?"
  ).bind(member.id).run()

  return c.json({ success: true, data: {} })
})

// Change member role (dorm leader only)
houses.put("/houses/:id/members/:userId/role", async (c) => {
  const { userId: currentUserId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const targetUserId = Number(c.req.param("userId"))
  const { role } = await c.req.json<{ role: string }>()

  if (!["寝室长", "普通成员"].includes(role)) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const currentMember = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, currentUserId).first<{ role: string }>()
  if (!currentMember || !hasMinRole(currentMember.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  await c.env.DB.prepare(
    "UPDATE members SET role = ? WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(role, houseId, targetUserId).run()

  return c.json({ success: true, data: {} })
})

// Remove member (dorm leader only)
houses.delete("/houses/:id/members/:userId", async (c) => {
  const { userId: currentUserId } = c.var.user
  const houseId = Number(c.req.param("id"))
  const targetUserId = Number(c.req.param("userId"))

  const currentMember = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, currentUserId).first<{ role: string }>()
  if (!currentMember || !hasMinRole(currentMember.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  await c.env.DB.prepare(
    "UPDATE members SET status = 'left', left_at = datetime('now') WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, targetUserId).run()

  return c.json({ success: true, data: {} })
})

// Get/renew invite code (dorm leader only)
houses.get("/houses/:id/invite-code", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first<{ role: string }>()
  if (!member || !hasMinRole(member.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  const house = await c.env.DB.prepare("SELECT invite_code, invite_code_expires_at FROM houses WHERE id = ?").bind(houseId).first()
  return c.json({ success: true, data: house })
})

houses.post("/houses/:id/invite-code/renew", async (c) => {
  const { userId } = c.var.user
  const houseId = Number(c.req.param("id"))

  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first<{ role: string }>()
  if (!member || !hasMinRole(member.role, "寝室长")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  const newCode = generateInviteCode()
  const newExpires = inviteCodeExpiresAt()
  await c.env.DB.prepare(
    "UPDATE houses SET invite_code = ?, invite_code_expires_at = ? WHERE id = ?"
  ).bind(newCode, newExpires, houseId).run()

  return c.json({ success: true, data: { invite_code: newCode, invite_code_expires_at: newExpires } })
})
