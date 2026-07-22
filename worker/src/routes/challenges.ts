import { Hono } from "hono"
import type { AppEnv, AuthVariables } from "../types"
import { authMiddleware } from "../middleware/auth"
import { settle } from "../algorithms/settlement"

// Recalculate settlement items for all non-challenged items after bills change
async function recalculateSettlement(db: D1Database, itemId: number) {
  const result = await db.prepare(`
    SELECT s.id, s.house_id, s.start_date, s.end_date FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id WHERE si.id = ?
  `).bind(itemId).first<{ id: number; house_id: number; start_date: string; end_date: string }>()
  if (!result) return

  const { id: settlementId, house_id, start_date, end_date } = result

  // Re-fetch bills/splits with updated amounts
  const bills = await db.prepare(`
    SELECT id, creator_id, total_amount FROM bills
    WHERE house_id = ? AND bill_date >= ? AND bill_date <= ?
      AND status IN ('已确认', '争议中', '再次确认', '待支付', '已支付')
  `).bind(house_id, start_date, end_date).all<{ id: number; creator_id: number; total_amount: number }>()
  if (!bills.results.length) return

  const billIds = bills.results.map(b => b.id)
  const splits = await db.prepare(`
    SELECT bill_id, user_id, amount FROM splits WHERE bill_id IN (${billIds.map(() => "?").join(",")})
  `).bind(...billIds).all<{ bill_id: number; user_id: number; amount: number }>()

  // Calculate net balances
  const balanceMap = new Map<number, number>()
  for (const bill of bills.results) {
    balanceMap.set(bill.creator_id, (balanceMap.get(bill.creator_id) ?? 0) + bill.total_amount)
  }
  for (const split of splits.results) {
    balanceMap.set(split.user_id, (balanceMap.get(split.user_id) ?? 0) - split.amount)
  }

  const balances = Array.from(balanceMap.entries())
    .filter(([_, amount]) => amount !== 0)
    .map(([userId, amount]) => ({ userId, amount }))
  if (!balances.length) return

  const newTransfers = settle(balances)

  // Get existing items (keep challenged ones to preserve their final_amount)
  const existing = await db.prepare(
    "SELECT id, payer_id, payee_id, original_amount, status FROM settlement_items WHERE settlement_id = ?"
  ).bind(settlementId).all<{ id: number; payer_id: number; payee_id: number; original_amount: number; status: string }>()

  const challengedItemIds = new Set(
    (await db.prepare("SELECT DISTINCT item_id FROM settlement_challenges WHERE status = 'resolved'")
      .all<{ item_id: number }>()).results.map(r => r.item_id)
  )

  // Delete non-challenged items that no longer match
  const existingMap = new Map<string, { id: number; original_amount: number }>()
  for (const ex of existing.results) {
    if (challengedItemIds.has(ex.id)) continue
    const key = `${ex.payer_id}-${ex.payee_id}`
    existingMap.set(key, ex)
  }

  const insertStmt = db.prepare(
    "INSERT INTO settlement_items (settlement_id, payer_id, payee_id, original_amount, final_amount) VALUES (?, ?, ?, ?, ?)"
  )
  const usedKeys = new Set<string>()

  for (const t of newTransfers) {
    const key = `${t.from}-${t.to}`
    usedKeys.add(key)
    const match = existingMap.get(key)

    if (match && match.original_amount === t.amount) {
      // No change needed
      continue
    }
    if (match) {
      // Update amount
      await db.prepare(
        "UPDATE settlement_items SET original_amount = ?, final_amount = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(t.amount, t.amount, match.id).run()
    } else {
      // New item
      await insertStmt.bind(settlementId, t.from, t.to, t.amount, t.amount).run()
    }
  }

  // Remove items that no longer have a corresponding transfer
  for (const ex of existing.results) {
    if (challengedItemIds.has(ex.id)) continue
    const key = `${ex.payer_id}-${ex.payee_id}`
    if (!usedKeys.has(key)) {
      await db.prepare("DELETE FROM settlement_items WHERE id = ?").bind(ex.id).run()
    }
  }
}

// After a challenge changes settlement_items.final_amount, sync back to bills and splits
async function syncBillsFromChallenge(
  db: D1Database, itemId: number, newAmount: number, houseId: number
) {
  const item = await db.prepare(`
    SELECT si.payer_id, si.original_amount, s.start_date, s.end_date
    FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first<{ payer_id: number; original_amount: number; start_date: string; end_date: string }>()
  if (!item) return

  const adjustment = item.original_amount - newAmount
  if (adjustment === 0) return

  // Find bills in the settlement's date range where the payer has splits
  const bills = await db.prepare(`
    SELECT DISTINCT b.id, b.total_amount FROM bills b
    JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND b.status != '草稿' AND s.user_id = ?
      AND b.bill_date >= ? AND b.bill_date <= ?
  `).bind(houseId, item.payer_id, item.start_date, item.end_date).all<{ id: number }>()
  if (!bills.results.length) return

  const billIds = bills.results.map(b => b.id)
  const placeholders = billIds.map(() => "?").join(",")

  // Get payer's splits in those bills
  const payerSplits = await db.prepare(`
    SELECT id, amount, bill_id FROM splits
    WHERE bill_id IN (${placeholders}) AND user_id = ?
  `).bind(...billIds, item.payer_id).all<{ id: number; amount: number; bill_id: number }>()
  if (!payerSplits.results.length) return

  // Prorate adjustment across payer's splits
  const totalPayer = payerSplits.results.reduce((s, r) => s + r.amount, 0)
  if (totalPayer === 0) return

  const sorted = payerSplits.results.map(r => ({ ...r, reduction: Math.round(adjustment * r.amount / totalPayer) }))
  // Fix rounding remainder on the largest split
  const appliedTotal = sorted.reduce((s, r) => s + r.reduction, 0)
  const remainder = adjustment - appliedTotal
  if (remainder !== 0 && sorted.length > 0) sorted[0].reduction += remainder

  for (const split of sorted) {
    await db.prepare("UPDATE splits SET amount = amount - ? WHERE id = ?")
      .bind(split.reduction, split.id).run()
  }

  // Recalculate bill totals
  for (const bill of bills.results) {
    const total = await db.prepare("SELECT SUM(amount) as total FROM splits WHERE bill_id = ?")
      .bind(bill.id).first<{ total: number | null }>()
    if (total?.total != null) {
      await db.prepare("UPDATE bills SET total_amount = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?")
        .bind(total.total, bill.id).run()
    }
  }
}

export const challenges = new Hono<{ Bindings: AppEnv; Variables: AuthVariables }>()

challenges.use("*", authMiddleware)

// Create challenge
challenges.post("/settlements/:settlementId/items/:itemId/challenges", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))
  const { reason, challenge_amount, requested_amount } = await c.req.json<{
    reason: string
    challenge_amount?: number
    requested_amount?: number | null
  }>()

  if (!reason) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first<{ id: number; house_id: number; final_amount: number; status: string }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  // Get current round
  const last = await c.env.DB.prepare(
    "SELECT MAX(round) as max_round FROM settlement_challenges WHERE item_id = ?"
  ).bind(itemId).first<{ max_round: number | null }>()
  const round = (last?.max_round ?? 0) + 1

  // Calculate timeout (3 days from now)
  const timeoutAt = new Date(Date.now() + 3 * 86400000).toISOString()

  // Create challenge
  const result = await c.env.DB.prepare(`
    INSERT INTO settlement_challenges
      (item_id, challenger_id, round, reason, challenge_amount, requested_amount,
       original_amount_snapshot, timeout_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).bind(
    itemId, userId, round, reason,
    challenge_amount ?? null, requested_amount ?? null,
    item.final_amount, timeoutAt
  ).run()
  const challengeId = Number(result.meta.last_row_id)

  // Mark item as disputed
  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'disputed', version = version + 1, updated_at = datetime('now') WHERE id = ?"
  ).bind(itemId).run()

  // Log
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, before_snapshot)
    VALUES (?, ?, 'challenge', 'settlement_challenges', ?, ?)
  `).bind(item.house_id, userId, challengeId, JSON.stringify({ item_id: itemId, original_amount: item.final_amount })).run()

  const challenge = await c.env.DB.prepare("SELECT * FROM settlement_challenges WHERE id = ?").bind(challengeId).first()
  return c.json({ success: true, data: challenge })
})

// Respond to challenge (adjust amount or reject)
challenges.post("/challenges/:id/respond", async (c) => {
  const { userId } = c.var.user
  const challengeId = Number(c.req.param("id"))
  const { action, adjusted_amount } = await c.req.json<{
    action: "adjust" | "reject"
    adjusted_amount?: number
  }>()

  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, si.payer_id, si.payee_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ? AND sc.status = 'open'
  `).bind(challengeId).first<{
    id: number; item_id: number; challenger_id: number
    payer_id: number; payee_id: number; house_id: number
  }>()
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400)

  // Only the person being challenged (the other party) can respond
  const isTarget = userId === challenge.payer_id || userId === challenge.payee_id
  if (!isTarget || userId === challenge.challenger_id) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  if (action === "adjust" && adjusted_amount != null) {
    await c.env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'resolved',
        adjusted_amount = ?, handler_id = ?, handled_at = datetime('now')
      WHERE id = ?
    `).bind(adjusted_amount, userId, challengeId).run()

    // Update settlement_item final_amount
    await c.env.DB.prepare(
      "UPDATE settlement_items SET final_amount = ?, status = 'confirmed', version = version + 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(adjusted_amount, challenge.item_id).run()

    await syncBillsFromChallenge(c.env.DB, challenge.item_id, adjusted_amount, challenge.house_id)
    await recalculateSettlement(c.env.DB, challenge.item_id)

    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
      VALUES (?, ?, 'challenge_adjusted', 'settlement_items', ?, ?)
    `).bind(challenge.house_id, userId, challenge.item_id,
      JSON.stringify({ final_amount: adjusted_amount })).run()
  } else {
    // Reject → escalate to dorm leader, keep open
    await c.env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'open', handler_id = ?, handled_at = datetime('now')
      WHERE id = ?
    `).bind(userId, challengeId).run()

    // Find dorm leader
    const leader = await c.env.DB.prepare(
      "SELECT user_id FROM members WHERE house_id = ? AND role = '寝室长' AND status = 'active' LIMIT 1"
    ).bind(challenge.house_id).first<{ user_id: number }>()

    if (leader) {
      await c.env.DB.prepare(`
        INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
        VALUES (?, ?, 'challenge_escalated', 'settlement_challenges', ?)
      `).bind(challenge.house_id, userId, challengeId).run()
    }
  }

  return c.json({ success: true, data: {} })
})

// Accept adjusted amount (challenger agrees to the adjustment)
challenges.post("/challenges/:id/accept", async (c) => {
  const { userId } = c.var.user
  const challengeId = Number(c.req.param("id"))

  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, si.payer_id, si.payee_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ? AND sc.status = 'open' AND sc.adjusted_amount IS NOT NULL
  `).bind(challengeId).first<{
    id: number; item_id: number; challenger_id: number
    adjusted_amount: number; house_id: number
  }>()
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400)
  if (challenge.challenger_id !== userId) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)
  }

  await c.env.DB.prepare(`
    UPDATE settlement_challenges SET status = 'resolved', handled_at = datetime('now')
    WHERE id = ?
  `).bind(challengeId).run()

  // final_amount already set in the respond step
  return c.json({ success: true, data: {} })
})

// Dorm leader ruling
challenges.post("/challenges/:id/ruling", async (c) => {
  const { userId } = c.var.user
  const challengeId = Number(c.req.param("id"))
  const { ruling, amount } = await c.req.json<{
    ruling: "support_challenger" | "support_respondent" | "compromise"
    amount?: number
  }>()

  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ?
  `).bind(challengeId).first<{
    id: number; item_id: number; challenger_id: number
    original_amount_snapshot: number; requested_amount: number | null; house_id: number
  }>()
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400)

  // Verify user is dorm leader
  const leader = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND role = '寝室长' AND status = 'active'"
  ).bind(challenge.house_id, userId).first()
  if (!leader) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  let finalAmount: number
  switch (ruling) {
    case "support_challenger":
      finalAmount = challenge.requested_amount ?? challenge.original_amount_snapshot
      break
    case "support_respondent":
      finalAmount = challenge.original_amount_snapshot
      break
    case "compromise":
      finalAmount = amount ?? challenge.original_amount_snapshot
      break
    default:
      return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)
  }

  await c.env.DB.prepare(`
    UPDATE settlement_challenges SET status = 'resolved',
      adjusted_amount = ?, handler_id = ?, handled_at = datetime('now')
    WHERE id = ?
  `).bind(finalAmount, userId, challengeId).run()

  await c.env.DB.prepare(`
    UPDATE settlement_items SET final_amount = ?, status = 'confirmed',
      version = version + 1, updated_at = datetime('now')
    WHERE id = ?
  `).bind(finalAmount, challenge.item_id).run()

  await syncBillsFromChallenge(c.env.DB, challenge.item_id, finalAmount, challenge.house_id)
  await recalculateSettlement(c.env.DB, challenge.item_id)

  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
    VALUES (?, ?, 'challenge_ruling', 'settlement_items', ?, ?)
  `).bind(challenge.house_id, userId, challenge.item_id,
    JSON.stringify({ ruling, final_amount: finalAmount })).run()

  return c.json({ success: true, data: {} })
})
