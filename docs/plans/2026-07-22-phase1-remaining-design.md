# Phase 1 Remaining Tasks — Design

## P1-01 — Settlement State Machine Simplification

### Current Problems
- Two-level state machine (`settlements` + `settlement_items`) with inconsistency risks
- `disputed_transfer` dead type in `settlement-state.ts` (not in DB CHECK)
- Challenge `rejected` state defined but never used
- Challenge `timeout` never triggered (no cron handler)

### Design

**Merge states — settlement status derived from items**

```
settlements.status: pending | confirmed | transferred   →   active | closed

settlement_items.status: unchanged (pending → confirmed → transferred, pending → disputed → confirmed)
```

**Migration:**
- `pending` → `active`
- `confirmed` / `transferred` → `closed`
- Update DB CHECK constraint on `settlements.status`

**Derived display state (frontend logic, not stored):**
- All items `transferred` → "已完成"
- Any item `disputed` → "争议中"
- All items `confirmed` → "已确认"
- All items `pending` → "待确认"
- Otherwise → "进行中"

**Route guard changes:**
- `POST /settlements/:id/confirm` — guard on `active`, set `closed`, batch items → `confirmed`
- `POST /settlements/:id/transfer` — guard on `active`, set `closed` (no batch item update)
- Item confirm/transfer — guard on settlement `active`
- Challenge create — guard on settlement `active`

**Dead code cleanup:**
- Remove `disputed_transfer` from `settlement-state.ts`
- Remove `rejected` from challenge status type (keep in DB for backward compat, never used)
- `scheduled()` cron: scan `timeout_at <= datetime('now') AND status = 'open'`, set `timeout`, restore item to `confirmed`

---

## P1-02 — partial_payments Compatibility

### Current Problems
- `partial_payments` table exists (DDL only) with zero business logic
- No API routes create/read/delete partial payments
- Settlement state machine has no concept of partial payment

### Design

**No new state — dynamic calculation.**

```
settlement_items: paid_amount INTEGER NOT NULL DEFAULT 0
  - paid_amount = SUM(partial_payments.amount WHERE item_id = ?)
  - remaining = final_amount - paid_amount

Display (derived, computed on read):
  - paid_amount >= final_amount → "已付清"
  - paid_amount > 0 → "部分支付 (paid / total)"
  - paid_amount = 0 → existing status text
```

**New routes (in settlements/actions.ts):**
- `POST /settlements/:id/items/:itemId/partial-payments` — insert row, update `paid_amount`
- `GET /settlements/:id/items/:itemId/partial-payments` — list
- `DELETE /settlements/:id/items/:itemId/partial-payments/:pid` — delete, recalc `paid_amount`

**Transfer guard update:**
- `POST /settlements/:id/items/:itemId/transfer` — reject if `paid_amount < final_amount`
- Zero-amount items auto-transfer

**Read update:**
- `GET /settlements/:id` — each item returns `paid_amount`, `remaining`

**Compatibility:**
- No partial_payments → `paid_amount = 0` → existing transfer flow works identically
- Existing `transferred` items → `paid_amount = final_amount` (migration backfill)

---

## P1-03 — Settlement Undo

### Scope
- **Redo deliberately excluded** — redo is meaningless (new bills may have been added)
- Three undo types:

**1. Undo entire settlement:**
```
POST /settlements/:id/undo
  Guard: status = 'closed'
  Action: delete items + cascade partial_payments + cascade challenges, set status → 'active'
  Saga: snapshot before, restore on error
```

**2. Undo single item:**
```
POST /settlements/:id/items/:itemId/undo
  Guard: status != 'pending' (at least confirmed/transferred/disputed)
  Action: delete related partial_payments + challenges, set item → 'pending'
  Saga: snapshot before, restore on error
```

**3. Undo challenge — excluded.** If a challenge was wrongly resolved, create a new one. Implementing challenge undo adds edge cases (what if item was already re-transferred after resolution?) without clear benefit.

---

## P1-10 — Frontend Service Layer

### Current Problems
- API URL strings hardcoded across 16+ pages
- Same endpoint called from both page code and store code
- No centralized API function naming/convention

### Design

**Directory: `miniprogram/services/`**

```
services/
  bill.js         — createBill, getBill, listBills, confirmBill, getMyBills
  house.js        — createHouse, getHouse, updateHouse, deleteHouse
  member.js       — listMembers, changeRole, removeMember, joinHouse
  settlement.js   — createSettlement, getSettlement, listSettlements,
                     confirmSettlement, transferSettlement,
                     confirmItem, transferItem, undo
  challenge.js    — createChallenge, respondChallenge, acceptChallenge, ruling
  payment.js      — listMethods, addMethod, deleteMethod, setDefault,
                     createPartialPayment, listPartialPayments
  notification.js — listNotifications, markRead
  stats.js        — getTrend, getCategory, getYearly
  ranking.js      — getRanking
  report.js       — getReports
```

**Each service module pattern:**
```js
const { request } = require('../utils/request')

async function listBills(houseId, params) {
  return request({ url: `/api/houses/${houseId}/bills`, data: params })
}
```

**Store refactor:** store actions use service functions instead of direct `request()` calls.

**Page refactor:** 16 pages migrate to `const billService = require('../../services/bill')` — no more `request()` calls or URL strings in page files.

**Out of scope:**
- No new state management library
- No TypeScript migration
- No auto-generated API docs

---

## Execution Order

```
P1-01 (state machine) → P1-02 (partial_payments) → P1-03 (undo) → P1-10 (service layer)
```

P1-01 is prerequisite for P1-02 (clean state machine first, then add partial payment states). P1-03 depends on P1-01 state cleanup. P1-10 is independent and can be done last.
