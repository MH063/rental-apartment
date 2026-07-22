import { describe, it, expect } from "vitest"
import { createTestApp } from "./helper"

describe("challenge integration", () => {
  it("creates challenge, responds with adjust → resolved", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Challenge Test" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'User 2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Bill: 1000 均摊 → user 2 owes 500
    const b1 = await authed("/api/bills", { method: "POST", body: JSON.stringify({
      house_id: 1, title: "Rent", total_amount: 1000, bill_date: "2026-07-01", split_type: "均摊",
      splits: [{ user_id: 1 }, { user_id: 2 }],
    }) })
    const bill = await b1.json()
    await authed(`/api/bills/${bill.data.id}/confirm`, { method: "POST" })

    // Settlement
    const s1 = await authed("/api/settlements", { method: "POST", body: JSON.stringify({
      house_id: 1, start_date: "2026-07-01", end_date: "2026-07-31",
    }) })
    const settle = await s1.json()
    const item = settle.data.items.find((i: Record<string, unknown>) => i.payer_id === 2)

    // Confirm item (needed before challenge)
    await authed(`/api/settlements/${settle.data.id}/items/${item.id}/confirm`, { method: "POST" })

    // Challenge by user 2 via settlement items route
    const cr = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/challenges`, {
      method: "POST", body: JSON.stringify({ reason: "Too expensive", challenge_amount: 300 }), asUser: 2,
    })
    const challenge = await cr.json()
    const chId = challenge.data.id

    // User 1 responds with adjust → resolves challenge + updates item
    const respond = await authed(`/api/challenges/${chId}/respond`, {
      method: "POST", body: JSON.stringify({ action: "adjust", adjusted_amount: 400 }),
    })
    expect(respond.status).toBe(200)
  })

  it("creates challenge, rejects to escalate, dorm leader ruling", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Test House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'User 2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Bill
    const b1 = await authed("/api/bills", { method: "POST", body: JSON.stringify({
      house_id: 1, title: "Bill", total_amount: 1000, bill_date: "2026-07-01", split_type: "均摊",
      splits: [{ user_id: 1 }, { user_id: 2 }],
    }) })
    const bill = await b1.json()
    await authed(`/api/bills/${bill.data.id}/confirm`, { method: "POST" })

    // Settlement
    const s1 = await authed("/api/settlements", { method: "POST", body: JSON.stringify({
      house_id: 1, start_date: "2026-07-01", end_date: "2026-07-31",
    }) })
    const settle = await s1.json()
    const item = settle.data.items.find((i: Record<string, unknown>) => i.payer_id === 2)

    await authed(`/api/settlements/${settle.data.id}/items/${item.id}/confirm`, { method: "POST" })

    // Challenge by user 2
    const cr = await authed(`/api/settlements/${settle.data.id}/items/${item.id}/challenges`, {
      method: "POST", body: JSON.stringify({ reason: "Disagree", challenge_amount: 300 }), asUser: 2,
    })
    const ch = await cr.json()
    const chId = ch.data.id

    // User 1 rejects → escalates to dorm leader
    const reject = await authed(`/api/challenges/${chId}/respond`, {
      method: "POST", body: JSON.stringify({ action: "reject" }),
    })
    expect(reject.status).toBe(200)

    // Dorm leader (user 1) issues compromise ruling
    const rule = await authed(`/api/challenges/${chId}/ruling`, {
      method: "POST", body: JSON.stringify({ ruling: "compromise", amount: 450 }),
    })
    expect(rule.status).toBe(200)
  })
})
