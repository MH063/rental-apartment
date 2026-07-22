import { describe, it, expect } from "vitest"
import { createTestApp } from "./helper"

describe("settlement integration", () => {
  it("creates settlement, confirms items, transfers, then undoes", async () => {
    const { authed, sql } = await createTestApp()

    // Create house
    const h1 = await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Settlement Test" }) })
    expect(h1.status).toBe(200)

    // Add user 2 as member
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'User 2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Create a bill (1000 均摊 between user 1 and user 2)
    const b1 = await authed("/api/bills", {
      method: "POST",
      body: JSON.stringify({
        house_id: 1, title: "Groceries", total_amount: 1000,
        bill_date: "2026-07-01", split_type: "均摊",
        splits: [{ user_id: 1 }, { user_id: 2 }],
      }),
    })
    expect(b1.status).toBe(200)
    const bill1 = await b1.json()

    // Confirm the bill
    const c1 = await authed(`/api/bills/${bill1.data.id}/confirm`, { method: "POST" })
    expect(c1.status).toBe(200)

    // Create settlement
    const s1 = await authed("/api/settlements", {
      method: "POST",
      body: JSON.stringify({ house_id: 1, title: "July", start_date: "2026-07-01", end_date: "2026-07-31" }),
    })
    expect(s1.status).toBe(200)
    const settleData = await s1.json()
    expect(settleData.data.status).toBe("active")

    const settleId = settleData.data.id
    const items = settleData.data.items
    expect(items.length).toBeGreaterThan(0)

    // Confirm all items
    for (const item of items) {
      const ci = await authed(`/api/settlements/${settleId}/items/${item.id}/confirm`, { method: "POST" })
      expect(ci.status).toBe(200)
    }

    // Transfer → closes settlement
    const tr = await authed(`/api/settlements/${settleId}/transfer`, { method: "POST" })
    expect(tr.status).toBe(200)

    // Verify settlement is now closed
    const detail = await authed(`/api/settlements/${settleId}`)
    const det = await detail.json()
    expect(det.data.status).toBe("closed")

    // Undo the settlement (undo works on closed settlements)
    const undoRes = await authed(`/api/settlements/${settleId}/undo`, { method: "POST" })
    expect(undoRes.status).toBe(200)
    const undoData = await undoRes.json()
    expect(undoData.data.status).toBe("active")
  })

  it("rejects undo on active settlement items", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Test House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'User 2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Create & confirm bill
    const b1 = await authed("/api/bills", { method: "POST", body: JSON.stringify({
      house_id: 1, title: "Bill", total_amount: 600, bill_date: "2026-07-01", split_type: "均摊", splits: [{ user_id: 1 }, { user_id: 2 }],
    }) })
    const bill = await b1.json()
    await authed(`/api/bills/${bill.data.id}/confirm`, { method: "POST" })

    // Create settlement
    const s1 = await authed("/api/settlements", { method: "POST", body: JSON.stringify({
      house_id: 1, start_date: "2026-07-01", end_date: "2026-07-31",
    }) })
    const settle = await s1.json()
    const item = settle.data.items[0]

    // Undo item while still pending → should fail
    const undoItem = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/undo`, { method: "POST" })
    expect(undoItem.status).toBe(400)
    const err = await undoItem.json()
    expect(err.error).toBe("ERR_SETTLE_STATUS_INVALID")
  })

  it("handles partial payments as payer", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'User 2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Create & confirm bill
    const b1 = await authed("/api/bills", { method: "POST", body: JSON.stringify({
      house_id: 1, title: "Bill", total_amount: 1000, bill_date: "2026-07-01", split_type: "均摊", splits: [{ user_id: 1 }, { user_id: 2 }],
    }) })
    const bill = await b1.json()
    await authed(`/api/bills/${bill.data.id}/confirm`, { method: "POST" })

    // Create settlement → item: user 2 pays 500 to user 1
    const s1 = await authed("/api/settlements", { method: "POST", body: JSON.stringify({
      house_id: 1, start_date: "2026-07-01", end_date: "2026-07-31",
    }) })
    const settle = await s1.json()
    const item = settle.data.items.find((i: Record<string, unknown>) => i.payer_id === 2)

    // User 2 adds partial payment of 300
    const pp = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/partial-payments`, {
      method: "POST", body: JSON.stringify({ amount: 300 }), asUser: 2,
    })
    expect(pp.status).toBe(200)
    const ppData = await pp.json()
    expect(ppData.data.amount).toBe(300)
    expect(ppData.data.payer_id).toBe(2)

    // List partial payments (as user 2)
    const ppList = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/partial-payments`, { asUser: 2 })
    expect(ppList.status).toBe(200)
    const list = await ppList.json()
    expect(list.data.length).toBe(1)
    expect(list.data[0].amount).toBe(300)

    // Delete the partial payment (as user 2)
    const ppDel = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/partial-payments/${ppData.data.id}`, {
      method: "DELETE", asUser: 2,
    })
    expect(ppDel.status).toBe(200)
  })
})
