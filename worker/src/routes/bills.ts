import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { splitEqual, splitByWeight, splitByDays, splitByUsage, splitByArea, splitByTier } from "../algorithms/split"
import type { SplitTier } from "../algorithms/split"

interface SplitInput {
  user_id: number
  parameter?: number
}

interface CreateBillInput {
  house_id: number
  title: string
  total_amount: number
  category_id?: number
  bill_date: string
  receipt_image?: string
  note?: string
  split_type: string
  splits: SplitInput[]
  tiers?: SplitTier[]
}

export const bills = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

bills.use("*", authMiddleware)

// Create bill
bills.post("/bills", async (c) => {
  const { userId } = c.var.user
  const body = await c.req.json<CreateBillInput>()

  if (!body.title || !body.total_amount || !body.split_type || !body.splits?.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(body.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  // Compute split amounts
  const params = body.splits.map((s) => s.parameter ?? 1)
  let amounts: number[]

  switch (body.split_type) {
    case "均摊":
      amounts = splitEqual(body.total_amount, body.splits.length)
      break
    case "权重":
      amounts = splitByWeight(body.total_amount, params)
      break
    case "天数":
      amounts = splitByDays(body.total_amount, params)
      break
    case "用量":
      amounts = splitByUsage(body.total_amount, params)
      break
    case "面积":
      amounts = splitByArea(body.total_amount, params)
      break
    case "阶梯":
      if (!body.tiers) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
      amounts = splitByTier(body.total_amount, params, body.tiers)
      break
    default:
      return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  const sum = amounts.reduce((a, b) => a + b, 0)
  if (sum !== body.total_amount) {
    amounts[amounts.length - 1] += body.total_amount - sum
  }

  // Insert bill
  const billResult = await c.env.DB.prepare(`
    INSERT INTO bills (house_id, creator_id, title, total_amount, category_id, bill_date, receipt_image, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '草稿')
  `).bind(
    body.house_id, userId, body.title, body.total_amount,
    body.category_id ?? null, body.bill_date, body.receipt_image ?? null, body.note ?? ""
  ).run()
  const billId = Number(billResult.meta.last_row_id)

  // Insert splits
  const stmt = c.env.DB.prepare(`
    INSERT INTO splits (bill_id, user_id, amount, split_type, weight)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < body.splits.length; i++) {
    await stmt.bind(billId, body.splits[i].user_id, amounts[i], body.split_type, body.splits[i].parameter ?? null).run()
  }

  // Log operation
  if (body.house_id) {
    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'create_bill', 'bills', ?)
    `).bind(body.house_id, userId, billId).run()
  }

  const bill = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first()
  const splits = await c.env.DB.prepare("SELECT * FROM splits WHERE bill_id = ?").bind(billId).all()

  return c.json({ success: true, data: { ...bill, splits: splits.results } })
})

// List bills with filtering + cursor pagination
bills.get("/bills", async (c) => {
  const { userId } = c.var.user
  const houseId = c.req.query("house_id")
  const status = c.req.query("status")
  const categoryId = c.req.query("category_id")
  const keyword = c.req.query("keyword")
  const startDate = c.req.query("start_date")
  const endDate = c.req.query("end_date")
  const minAmount = c.req.query("min_amount")
  const maxAmount = c.req.query("max_amount")
  const cursor = c.req.query("cursor")
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100)

  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  let sql = "SELECT * FROM bills WHERE house_id = ?"
  const params: unknown[] = [Number(houseId)]

  if (status) { sql += " AND status = ?"; params.push(status) }
  if (categoryId) { sql += " AND category_id = ?"; params.push(Number(categoryId)) }
  if (keyword) { sql += " AND title LIKE ?"; params.push(`%${keyword}%`) }
  if (startDate) { sql += " AND bill_date >= ?"; params.push(startDate) }
  if (endDate) { sql += " AND bill_date <= ?"; params.push(endDate) }
  if (minAmount) { sql += " AND total_amount >= ?"; params.push(Number(minAmount)) }
  if (maxAmount) { sql += " AND total_amount <= ?"; params.push(Number(maxAmount)) }
  if (cursor) { sql += " AND id < ?"; params.push(Number(cursor)) }

  sql += " ORDER BY created_at DESC LIMIT ?"
  params.push(limit + 1)

  const result = await c.env.DB.prepare(sql).bind(...params).all()
  const hasMore = result.results.length > limit
  const items = hasMore ? result.results.slice(0, limit) : result.results
  const nextCursor = hasMore ? String(items[items.length - 1].id) : null

  return c.json({ success: true, data: { items, next_cursor: nextCursor } })
})

// List bills where current user has a split
bills.get("/bills/my", async (c) => {
  const { userId } = c.var.user
  const houseId = c.req.query("house_id")
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const bills = await c.env.DB.prepare(`
    SELECT DISTINCT b.* FROM bills b
    JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND s.user_id = ?
    ORDER BY b.created_at DESC
  `).bind(Number(houseId), userId).all()

  return c.json({ success: true, data: bills.results })
})

// Get bill detail with splits
bills.get("/bills/:id", async (c) => {
  const { userId } = c.var.user
  const billId = Number(c.req.param("id"))

  const bill = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first<{ house_id: number }>()
  if (!bill) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(bill.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const splits = await c.env.DB.prepare(`
    SELECT s.*, u.nickname, u.avatar FROM splits s
    JOIN users u ON u.id = s.user_id
    WHERE s.bill_id = ? ORDER BY s.id
  `).bind(billId).all()

  return c.json({ success: true, data: { ...bill, splits: splits.results } })
})

// Update bill (only 草稿, only creator, not during active settlement)
bills.put("/bills/:id", async (c) => {
  const { userId } = c.var.user
  const billId = Number(c.req.param("id"))

  const bill = await c.env.DB.prepare(
    "SELECT * FROM bills WHERE id = ? AND creator_id = ? AND status = '草稿'"
  ).bind(billId, userId).first<{ house_id: number; bill_date: string }>()
  if (!bill) return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400)

  // 校验该账单是否处于进行中的结算单周期内
  const activeSettlement = await c.env.DB.prepare(
    "SELECT id FROM settlements WHERE house_id = ? AND status = 'active' AND start_date <= ? AND end_date >= ? LIMIT 1"
  ).bind(bill.house_id, bill.bill_date, bill.bill_date).first()
  if (activeSettlement) {
    return c.json({ success: false, error: "ERR_BILL_IN_ACTIVE_SETTLEMENT" }, 400)
  }

  const body = await c.req.json<Partial<CreateBillInput>>()

  if (body.title !== undefined || body.total_amount !== undefined || body.category_id !== undefined) {
    await c.env.DB.prepare(`
      UPDATE bills SET title = COALESCE(?, title), total_amount = COALESCE(?, total_amount),
        category_id = COALESCE(?, category_id), receipt_image = COALESCE(?, receipt_image),
        note = COALESCE(?, note), updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.title ?? null, body.total_amount ?? null, body.category_id ?? null,
      body.receipt_image ?? null, body.note ?? null, billId
    ).run()
  }

  if (body.splits && body.split_type && body.total_amount) {
    await c.env.DB.prepare("DELETE FROM splits WHERE bill_id = ?").bind(billId).run()

    const params = body.splits.map((s) => s.parameter ?? 1)
    let amounts: number[]
    switch (body.split_type) {
      case "均摊": amounts = splitEqual(body.total_amount, body.splits.length); break
      case "权重": amounts = splitByWeight(body.total_amount, params); break
      case "天数": amounts = splitByDays(body.total_amount, params); break
      case "用量": amounts = splitByUsage(body.total_amount, params); break
      case "面积": amounts = splitByArea(body.total_amount, params); break
      case "阶梯":
        amounts = splitByTier(body.total_amount, params, body.tiers ?? [])
        break
      default: return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
    }

    const sum = amounts.reduce((a, b) => a + b, 0)
    if (sum !== body.total_amount) amounts[amounts.length - 1] += body.total_amount - sum

    const stmt = c.env.DB.prepare("INSERT INTO splits (bill_id, user_id, amount, split_type, weight) VALUES (?, ?, ?, ?, ?)")
    for (let i = 0; i < body.splits.length; i++) {
      await stmt.bind(billId, body.splits[i].user_id, amounts[i], body.split_type, body.splits[i].parameter ?? null).run()
    }
  }

  const updated = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first()
  const splits = await c.env.DB.prepare("SELECT * FROM splits WHERE bill_id = ?").bind(billId).all()

  return c.json({ success: true, data: { ...updated, splits: splits.results } })
})

// Delete bill (only 草稿, only creator, not during active settlement)
bills.delete("/bills/:id", async (c) => {
  const { userId } = c.var.user
  const billId = Number(c.req.param("id"))

  const bill = await c.env.DB.prepare(
    "SELECT id, house_id, bill_date FROM bills WHERE id = ? AND creator_id = ? AND status = '草稿'"
  ).bind(billId, userId).first<{ id: number; house_id: number; bill_date: string }>()
  if (!bill) return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400)

  // 校验该账单是否处于进行中的结算单周期内
  const activeSettlement = await c.env.DB.prepare(
    "SELECT id FROM settlements WHERE house_id = ? AND status = 'active' AND start_date <= ? AND end_date >= ? LIMIT 1"
  ).bind(bill.house_id, bill.bill_date, bill.bill_date).first()
  if (activeSettlement) {
    return c.json({ success: false, error: "ERR_BILL_IN_ACTIVE_SETTLEMENT" }, 400)
  }

  await c.env.DB.prepare("DELETE FROM splits WHERE bill_id = ?").bind(billId).run()
  await c.env.DB.prepare("DELETE FROM bills WHERE id = ?").bind(billId).run()

  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
    VALUES (?, ?, 'delete_bill', 'bills', ?)
  `).bind(bill.house_id, userId, billId).run()

  return c.json({ success: true, data: {} })
})

// R2 file upload
bills.post("/r2/upload", async (c) => {
  const { userId } = c.var.user
  const body = await c.req.parseBody()
  const file = body.file as File | null
  if (!file) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const key = `receipts/${userId}/${Date.now()}_${file.name}`
  await c.env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  return c.json({ success: true, data: { key } })
})

// Confirm bill (move from 草稿 → 已确认)
bills.post("/bills/:id/confirm", async (c) => {
  const { userId } = c.var.user
  const billId = Number(c.req.param("id"))

  const bill = await c.env.DB.prepare(
    "SELECT id, house_id, creator_id, status, version FROM bills WHERE id = ?"
  ).bind(billId).first<{ id: number; house_id: number; creator_id: number; status: string; version: number }>()
  if (!bill) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404)
  if (bill.creator_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  if (bill.status !== "草稿") return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400)

  await c.env.DB.prepare(
    "UPDATE bills SET status = '已确认', version = version + 1, updated_at = datetime('now') WHERE id = ? AND version = ?"
  ).bind(billId, bill.version || 1).run()

  return c.json({ success: true, data: {} })
})
