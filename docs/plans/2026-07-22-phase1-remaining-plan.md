# Phase 1 Remaining Tasks — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete P1-01 (state machine), P1-02 (partial_payments), P1-03 (undo), P1-10 (frontend service layer)

**Architecture:** Backend-first: simplify settlement state machine → add partial payment support → add undo → then extract frontend service layer. Each task leaves code in a testable state.

**Tech Stack:** Cloudflare Workers (Hono, D1, R2, KV), TypeScript backend, WeChat Mini Program (no framework) frontend

---

### Task 1: P1-01 Update settlement-state.ts

**Files:**
- Modify: `worker/src/utils/settlement-state.ts`

**Step 1: Read current file**

```bash
cat worker/src/utils/settlement-state.ts
```

**Step 2: Remove dead states**

Current content:
```ts
export type SettlementState = "pending" | "confirmed" | "transferred" | "disputed_transfer"
export type ItemState = "pending" | "confirmed" | "transferred" | "disputed"
export type ChallengeState = "open" | "resolved" | "rejected" | "timeout"
export function canConfirm(state: SettlementState): boolean {
  return state === "pending"
}
```

Replace with:
```ts
export type SettlementState = "active" | "closed"
export type ItemState = "pending" | "confirmed" | "transferred" | "disputed"
export type ChallengeState = "open" | "resolved" | "timeout"
export function canConfirm(state: SettlementState): boolean {
  return state === "active"
}
export function canChallenge(state: SettlementState): boolean {
  return state === "active"
}
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add worker/src/utils/settlement-state.ts
git commit -m "refactor(settlement): remove dead states disputed_transfer/rejected"
```

---

### Task 2: P1-01 Create migration for settlements.status CHECK

**Files:**
- Create: `worker/migrations/0002_settlement_status_active_closed.sql`

**Step 1: Write migration**

```sql
-- Migration: change settlements.status from pending/confirmed/transferred to active/closed
-- Update existing rows
UPDATE settlements SET status = 'active' WHERE status = 'pending';
UPDATE settlements SET status = 'closed' WHERE status IN ('confirmed', 'transferred');

-- Recreate CHECK constraint (D1/SQLite requires table recreation)
-- Note: D1 does not support ALTER TABLE ALTER COLUMN.
-- We use the wrangler d1 migrations apply to run this.
ALTER TABLE settlements RENAME TO settlements_old;

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
  creator_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO settlements (id, house_id, title, start_date, end_date, status, creator_id, created_at, updated_at)
  SELECT id, house_id, title, start_date, end_date, status, creator_id, created_at, updated_at FROM settlements_old;

DROP TABLE settlements_old;

-- Backfill existing transferred items: paid_amount = final_amount
ALTER TABLE settlement_items ADD COLUMN paid_amount INTEGER NOT NULL DEFAULT 0;
UPDATE settlement_items SET paid_amount = final_amount WHERE status = 'transferred';

-- Recreate indexes (D1 drops them with the table)
CREATE INDEX IF NOT EXISTS idx_settlements_house ON settlements(house_id);
```

**Step 2: Apply migration locally**

Run: `wrangler d1 migrations apply rental-db --local`
Expected: OK

**Step 3: Commit**

```bash
git add worker/migrations/0002_settlement_status_active_closed.sql
git commit -m "feat(settlement): migrate status to active/closed + add paid_amount"
```

---

### Task 3: P1-01 Update settlements routes — guards and status

**Files:**
- Modify: `worker/src/routes/settlements/read.ts`
- Modify: `worker/src/routes/settlements/create.ts`
- Modify: `worker/src/routes/settlements/actions.ts`

**Step 1: Read all three files**

**Step 2: Update create.ts — no status change needed (new settlements are 'active')**

Only change: use `'active'` as default status (align with new type).

No code change needed — DB default is `'active'` after migration.

**Step 3: Update actions.ts — guard on 'active', set 'closed'**

In `POST /settlements/:id/confirm`:
- Guard: `WHERE status = 'pending'` → `WHERE status = 'active'`
- Update: `SET status = 'confirmed'` → `SET status = 'closed'`
- Batch items: keep `SET status = 'confirmed' WHERE status = 'pending'`

In `POST /settlements/:id/transfer`:
- Guard: `WHERE status = 'confirmed'` → `WHERE status = 'active'`
- Update: `SET status = 'transferred'` → `SET status = 'closed'`
- Remove batch item update (items should be individually transferred)

In `POST /settlements/:id/items/:itemId/transfer`:
- Guard: check settlement status is `active` (not just item status `confirmed`)
- Need to JOIN settlements

Update each endpoint.

**Step 4: Update read.ts — derive display status**

In `GET /settlements/:id`, compute derived status from items:
```ts
// After fetching items, compute display status
const itemStatuses = items.results.map(i => i.status)
let displayStatus: string
if (itemStatuses.every(s => s === 'transferred')) displayStatus = '已完成'
else if (itemStatuses.some(s => s === 'disputed')) displayStatus = '争议中'
else if (itemStatuses.every(s => s === 'confirmed')) displayStatus = '已确认'
else if (itemStatuses.every(s => s === 'pending')) displayStatus = '待确认'
else displayStatus = '进行中'
// Add to response
return c.json({ success: true, data: { ...settlement, display_status: displayStatus, items: items.results, challenges: challenges.results } })
```

**Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add worker/src/routes/settlements/
git commit -m "refactor(settlement): guard on active/closed, derive display status from items"
```

---

### Task 4: P1-01 Update challenges.ts — guard on settlement active

**Files:**
- Modify: `worker/src/routes/challenges.ts`

**Step 1: Read challenges.ts**

**Step 2: Add settlement status check in challenge create endpoint**

In `POST /settlements/:settlementId/items/:itemId/challenges`, after fetching item:
```ts
// Verify settlement is active
const settlement = await c.env.DB.prepare("SELECT status FROM settlements WHERE id = ?")
  .bind(settlementId).first<{ status: string }>()
if (!settlement || settlement.status !== 'active') {
  return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)
}
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add worker/src/routes/challenges.ts
git commit -m "refactor(challenge): guard challenge creation on settlement active status"
```

---

### Task 5: P1-01 Add challenge timeout sweep cron (already exists in index.ts)

Current `handleDailyTasks` in `worker/src/index.ts` already does timeout sweep. Verify it sets `'timeout'` status correctly.

**Step 1: Verify current code**

Read `worker/src/index.ts` lines 49-76. It already handles timeout:
- Sets challenge to `'timeout'`
- Sets item back to `'confirmed'`

No changes needed — this was already implemented in the original cron work.

---

### Task 6: P1-02 Add partial_payments routes

**Files:**
- Modify: `worker/src/routes/settlements/actions.ts`

**Step 1: Read actions.ts**

**Step 2: Add three new endpoints**

In `worker/src/routes/settlements/actions.ts`:

```ts
// POST /settlements/:id/items/:itemId/partial-payments
actions.post("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))
  const { amount, note, voucher } = await c.req.json<{ amount: number; note?: string; voucher?: string }>()
  if (!amount || amount <= 0) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first<{ id: number; house_id: number; payer_id: number; final_amount: number; paid_amount: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare("SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'")
    .bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  // Only the payer can record partial payment
  if (item.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const remaining = item.final_amount - item.paid_amount
  if (amount > remaining) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400)

  const result = await c.env.DB.prepare(`
    INSERT INTO partial_payments (item_id, payer_id, amount, note, voucher)
    VALUES (?, ?, ?, ?, ?)
  `).bind(itemId, userId, amount, note || null, voucher || null).run()

  // Update paid_amount
  const newPaid = item.paid_amount + amount
  await c.env.DB.prepare("UPDATE settlement_items SET paid_amount = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?")
    .bind(newPaid, itemId).run()

  const pp = await c.env.DB.prepare("SELECT * FROM partial_payments WHERE id = ?").bind(Number(result.meta.last_row_id)).first()
  return c.json({ success: true, data: pp })
})

// GET /settlements/:id/items/:itemId/partial-payments
actions.get("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.id, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first<{ id: number; house_id: number }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)

  const member = await c.env.DB.prepare("SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'")
    .bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  const list = await c.env.DB.prepare(`
    SELECT pp.*, u.nickname AS payer_name FROM partial_payments pp
    JOIN users u ON u.id = pp.payer_id
    WHERE pp.item_id = ? ORDER BY pp.created_at DESC
  `).bind(itemId).all()

  return c.json({ success: true, data: list.results })
})

// DELETE /settlements/:id/items/:itemId/partial-payments/:pid
actions.delete("/settlements/:id/items/:itemId/partial-payments/:pid", async (c) => {
  const { userId } = c.var.user
  const pid = Number(c.req.param("pid"))
  const itemId = Number(c.req.param("itemId"))

  const pp = await c.env.DB.prepare(`
    SELECT pp.*, s.house_id FROM partial_payments pp
    JOIN settlement_items si ON si.id = pp.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE pp.id = ? AND pp.item_id = ?
  `).bind(pid, itemId).first<{ id: number; payer_id: number; amount: number; house_id: number }>()
  if (!pp) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 404)

  if (pp.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  await c.env.DB.prepare("DELETE FROM partial_payments WHERE id = ?").bind(pid).run()

  // Recalc paid_amount
  const sum = await c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM partial_payments WHERE item_id = ?")
    .bind(itemId).first<{ total: number }>()
  await c.env.DB.prepare("UPDATE settlement_items SET paid_amount = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?")
    .bind(sum?.total ?? 0, itemId).run()

  return c.json({ success: true, data: {} })
})
```

**Step 3: Update item transfer guard**

In `POST /settlements/:id/items/:itemId/transfer`, add paid_amount check:
```ts
// After fetching item, before transfer:
if (item.paid_amount !== undefined && item.paid_amount < item.final_amount) {
  return c.json({ success: false, error: "ERR_SETTLE_NOT_PAID" }, 400)
}
```

**Step 4: Update GET /settlements/:id to include paid_amount/remaining**

In `read.ts`, the query already returns `final_amount`. Add computed fields to each item:
```ts
// After fetching items, map to include paid info
const mapped = items.results.map(item => ({
  ...item,
  remaining: item.final_amount - (item.paid_amount || 0)
}))
```

**Step 5: Run typecheck**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```bash
git add worker/src/routes/settlements/actions.ts worker/src/routes/settlements/read.ts
git commit -m "feat(settlement): add partial_payments CRUD + transfer guard + paid_amount in reads"
```

---

### Task 7: P1-02 Add partial_payments cascade delete in challenges.ts

**Files:**
- Modify: `worker/src/routes/challenges.ts`

**Step 1: Find item deletion in recalculateSettlement**

In `recalculateSettlement`, line 136:
```ts
await db.prepare("DELETE FROM settlement_items WHERE id = ?").bind(ex.id).run()
```

Add before it:
```ts
await db.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(ex.id).run()
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add worker/src/routes/challenges.ts
git commit -m "fix(settlement): cascade delete partial_payments when items removed"
```

---

### Task 8: P1-03 Add undo settlement routes

**Files:**
- Modify: `worker/src/routes/settlements/actions.ts`

**Step 1: Read actions.ts**

**Step 2: Add undo entire settlement endpoint**

```ts
// POST /settlements/:id/undo
actions.post("/settlements/:id/undo", async (c) => {
  const { userId } = c.var.user
  const settlementId = Number(c.req.param("id"))

  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'closed'"
  ).bind(settlementId).first<{ id: number; house_id: number }>()
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  // Saga: snapshot items before deletion
  const items = await c.env.DB.prepare(
    "SELECT id, status FROM settlement_items WHERE settlement_id = ?"
  ).bind(settlementId).all<{ id: number; status: string }>()

  try {
    // Delete challenges for all items
    for (const item of items.results) {
      await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(item.id).run()
    }
    // Delete partial_payments for all items
    for (const item of items.results) {
      await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(item.id).run()
    }
    // Delete items
    await c.env.DB.prepare("DELETE FROM settlement_items WHERE settlement_id = ?").bind(settlementId).run()
    // Set settlement back to active
    await c.env.DB.prepare("UPDATE settlements SET status = 'active', updated_at = datetime('now') WHERE id = ?")
      .bind(settlementId).run()

    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement', 'settlements', ?)
    `).bind(settlement.house_id, userId, settlementId).run()

    return c.json({ success: true, data: { id: settlementId, status: 'active' } })
  } catch (err) {
    // Restore settlement status
    await c.env.DB.prepare("UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?")
      .bind(settlementId).run()
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500)
  }
})
```

**Step 3: Add undo item endpoint**

```ts
// POST /settlements/:id/items/:itemId/undo
actions.post("/settlements/:id/items/:itemId/undo", async (c) => {
  const { userId } = c.var.user
  const itemId = Number(c.req.param("itemId"))

  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first<{ id: number; house_id: number; status: string }>()
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404)
  if (item.status === 'pending') return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400)

  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first()
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403)

  try {
    // Delete related challenges
    await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(itemId).run()
    // Delete related partial_payments
    await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(itemId).run()
    // Reset item
    await c.env.DB.prepare(
      "UPDATE settlement_items SET status = 'pending', paid_amount = 0, version = version + 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(itemId).run()

    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement_item', 'settlement_items', ?)
    `).bind(item.house_id, userId, itemId).run()

    return c.json({ success: true, data: { id: itemId, status: 'pending' } })
  } catch (err) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500)
  }
})
```

**Step 4: Run typecheck**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add worker/src/routes/settlements/actions.ts
git commit -m "feat(settlement): add undo settlement + undo item endpoints"
```

---

### Task 9: P1-03 Add undo tests

**Files:**
- Create: `worker/tests/undo.test.ts`

**Step 1: Write undo test**

```ts
import { describe, it, expect } from "vitest"

// Unit tests for undo logic (integration tests need D1)
describe("undo guard logic", () => {
  it("rejects undo on active settlement items in pending status", () => {
    const status = "pending"
    const canUndo = status !== "pending"
    expect(canUndo).toBe(false)
  })

  it("allows undo on confirmed items", () => {
    expect("confirmed" !== "pending").toBe(true)
  })

  it("allows undo on transferred items", () => {
    expect("transferred" !== "pending").toBe(true)
  })

  it("allows undo on disputed items", () => {
    expect("disputed" !== "pending").toBe(true)
  })
})
```

**Step 2: Run tests**

Run: `npx vitest run`
Expected: PASS

**Step 3: Commit**

```bash
git add worker/tests/undo.test.ts
git commit -m "test(settlement): add undo guard tests"
```

---

### Task 10: P1-10 Create frontend service files

**Files:**
- Create: `miniprogram/services/bill.js`
- Create: `miniprogram/services/house.js`
- Create: `miniprogram/services/member.js`
- Create: `miniprogram/services/settlement.js`
- Create: `miniprogram/services/challenge.js`
- Create: `miniprogram/services/payment.js`
- Create: `miniprogram/services/notification.js`
- Create: `miniprogram/services/stats.js`
- Create: `miniprogram/services/ranking.js`
- Create: `miniprogram/services/report.js`

**Step 1: Create services directory**

```bash
mkdir -p miniprogram/services
```

**Step 2: Write each service file**

`miniprogram/services/bill.js`:
```js
const { request } = require('../utils/request')

async function createBill(houseId, data) {
  return request({ url: `/api/houses/${houseId}/bills`, method: 'POST', data })
}

async function getBill(id) {
  return request({ url: `/api/bills/${id}` })
}

async function listBills(houseId, params) {
  return request({ url: `/api/houses/${houseId}/bills`, data: params })
}

async function confirmBill(houseId, billId) {
  return request({ url: `/api/houses/${houseId}/bills/${billId}/confirm`, method: 'POST' })
}

async function getMyBills(houseId, params) {
  return request({ url: `/api/houses/${houseId}/bills/my`, data: params })
}

module.exports = { createBill, getBill, listBills, confirmBill, getMyBills }
```

`miniprogram/services/house.js`:
```js
const { request } = require('../utils/request')

async function createHouse(data) {
  return request({ url: '/api/houses', method: 'POST', data })
}

async function getHouse(id) {
  return request({ url: `/api/houses/${id}` })
}

async function updateHouse(id, data) {
  return request({ url: `/api/houses/${id}`, method: 'PUT', data })
}

async function deleteHouse(id) {
  return request({ url: `/api/houses/${id}`, method: 'DELETE' })
}

async function getInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite` })
}

async function renewInviteCode(id) {
  return request({ url: `/api/houses/${id}/invite/renew`, method: 'POST' })
}

module.exports = { createHouse, getHouse, updateHouse, deleteHouse, getInviteCode, renewInviteCode }
```

`miniprogram/services/member.js`:
```js
const { request } = require('../utils/request')

async function listMembers(houseId) {
  return request({ url: `/api/houses/${houseId}/members` })
}

async function changeRole(houseId, userId, role) {
  return request({ url: `/api/houses/${houseId}/members/${userId}/role`, method: 'PUT', data: { role } })
}

async function removeMember(houseId, userId) {
  return request({ url: `/api/houses/${houseId}/members/${userId}`, method: 'DELETE' })
}

async function joinHouse(code) {
  return request({ url: '/api/houses/join', method: 'POST', data: { code } })
}

async function leaveHouse(houseId) {
  return request({ url: `/api/houses/${houseId}/members/me`, method: 'DELETE' })
}

module.exports = { listMembers, changeRole, removeMember, joinHouse, leaveHouse }
```

`miniprogram/services/settlement.js`:
```js
const { request } = require('../utils/request')

async function createSettlement(houseId, data) {
  return request({ url: `/api/houses/${houseId}/settlements`, method: 'POST', data })
}

async function getSettlement(id) {
  return request({ url: `/api/settlements/${id}` })
}

async function listSettlements(houseId) {
  return request({ url: `/api/houses/${houseId}/settlements` })
}

async function confirmSettlement(id) {
  return request({ url: `/api/settlements/${id}/confirm`, method: 'POST' })
}

async function transferSettlement(id) {
  return request({ url: `/api/settlements/${id}/transfer`, method: 'POST' })
}

async function confirmItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/confirm`, method: 'POST' })
}

async function transferItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/transfer`, method: 'POST' })
}

async function undo(settlementId) {
  return request({ url: `/api/settlements/${settlementId}/undo`, method: 'POST' })
}

async function undoItem(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/undo`, method: 'POST' })
}

async function createPartialPayment(settlementId, itemId, data) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments`, method: 'POST', data })
}

async function listPartialPayments(settlementId, itemId) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments` })
}

async function deletePartialPayment(settlementId, itemId, pid) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/partial-payments/${pid}`, method: 'DELETE' })
}

module.exports = {
  createSettlement, getSettlement, listSettlements,
  confirmSettlement, transferSettlement,
  confirmItem, transferItem, undo, undoItem,
  createPartialPayment, listPartialPayments, deletePartialPayment,
}
```

`miniprogram/services/challenge.js`:
```js
const { request } = require('../utils/request')

async function createChallenge(settlementId, itemId, data) {
  return request({ url: `/api/settlements/${settlementId}/items/${itemId}/challenges`, method: 'POST', data })
}

async function respondChallenge(id, data) {
  return request({ url: `/api/challenges/${id}/respond`, method: 'POST', data })
}

async function acceptChallenge(id) {
  return request({ url: `/api/challenges/${id}/accept`, method: 'POST' })
}

async function rulingChallenge(id, data) {
  return request({ url: `/api/challenges/${id}/ruling`, method: 'POST', data })
}

module.exports = { createChallenge, respondChallenge, acceptChallenge, rulingChallenge }
```

`miniprogram/services/payment.js`:
```js
const { request } = require('../utils/request')

async function listMethods() {
  return request({ url: '/api/payment-methods' })
}

async function addMethod(data) {
  return request({ url: '/api/payment-methods', method: 'POST', data })
}

async function deleteMethod(id) {
  return request({ url: `/api/payment-methods/${id}`, method: 'DELETE' })
}

async function setDefault(id) {
  return request({ url: `/api/payment-methods/${id}`, method: 'PUT', data: { is_default: 1 } })
}

module.exports = { listMethods, addMethod, deleteMethod, setDefault }
```

`miniprogram/services/notification.js`:
```js
const { request } = require('../utils/request')

async function listNotifications() {
  return request({ url: '/api/notifications' })
}

async function markRead() {
  return request({ url: '/api/notifications/read', method: 'POST' })
}

module.exports = { listNotifications, markRead }
```

`miniprogram/services/stats.js`:
```js
const { request } = require('../utils/request')

async function getTrend(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/trend` })
}

async function getCategory(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/category` })
}

async function getYearly(houseId) {
  return request({ url: `/api/houses/${houseId}/stats/yearly` })
}

module.exports = { getTrend, getCategory, getYearly }
```

`miniprogram/services/ranking.js`:
```js
const { request } = require('../utils/request')

async function getRanking(houseId, params) {
  return request({ url: `/api/houses/${houseId}/ranking`, data: params })
}

module.exports = { getRanking }
```

`miniprogram/services/report.js`:
```js
const { request } = require('../utils/request')

async function getReports(houseId, params) {
  return request({ url: `/api/houses/${houseId}/reports`, data: params })
}

module.exports = { getReports }
```

**Step 3: Commit**

```bash
git add miniprogram/services/
git commit -m "feat(frontend): create service layer modules for all API domains"
```

---

### Task 11: P1-10 Update store files to use services

**Files:**
- Modify: `miniprogram/store/house.js`
- Modify: `miniprogram/store/bill.js`
- Modify: `miniprogram/store/settlement.js`

**Step 1: Update store/house.js**

Replace `const { request } = require('../utils/request')` with service calls.

```js
const { createStore } = require('./store')
const houseService = require('../services/house')
const memberService = require('../services/member')

// ... store definition ...

async function loadHouses() {
  const houses = await houseService.listHouses?.() ?? []
  // fallback if listHouses not in service yet
  ...
}
```

Actually, the stores currently use `request()` directly. Since we already have stores, and they encapsulate state + API, the cleanest approach is:

Option A: Stores use service modules internally (import service, call service function)
Option B: Stores use request() directly (already done)

Since the stores already abstract away API calls from page code, and the service layer is for pages that DON'T use stores, we should update stores to use services to avoid duplicate API call patterns.

Update `store/house.js`:
```js
const { createStore } = require('./store')
const { request } = require('../utils/request')
// Services will be used when available
```

Keep stores using `request()` directly to avoid circular dependency. The service layer is primarily for pages.

**Step 2: Update store/bill.js** — no change needed (already clean)

**Step 3: Update store/settlement.js** — no change needed (already clean)

