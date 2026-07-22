import { describe, it, expect } from "vitest"
import { createTestApp } from "./helper"

describe("invite", () => {
  it("creates house, gets invite code, another user joins", async () => {
    const { authed, sql } = await createTestApp()

    // Create house
    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Invite House" }) })

    // Get invite code
    const inv = await authed("/api/houses/1/invite-code")
    expect(inv.status).toBe(200)
    const invData = await inv.json()
    expect(invData.data.invite_code).toBeTruthy()
    const code = invData.data.invite_code

    // Seed user 3 (not a member yet)
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (3, 'u3', 'User 3')")

    // User 3 joins via invite code
    const joinRes = await authed(`/api/houses/1/join`, {
      method: "POST", body: JSON.stringify({ code }), asUser: 3,
    })
    expect(joinRes.status).toBe(200)
  })
})

describe("leave house", () => {
  it("allows member to leave a house", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Leave House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (4, 'u4', 'User 4')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 4, '普通成员')")

    const leave = await authed("/api/houses/1/leave", { method: "POST", asUser: 4 })
    expect(leave.status).toBe(200)
  })
})

describe("categories", () => {
  it("CRUD categories via house", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Cat House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'U2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Create
    const c1 = await authed("/api/houses/1/categories", {
      method: "POST", body: JSON.stringify({ name: "Food" }),
    })
    expect(c1.status).toBe(200)
    const cat = await c1.json()
    expect(cat.data.name).toBe("Food")
    const catId = cat.data.id

    // List
    const list = await authed("/api/houses/1/categories")
    expect(list.status).toBe(200)
    const listData = await list.json()
    expect(listData.data.length).toBeGreaterThanOrEqual(1)

    // Update
    const u1 = await authed(`/api/houses/1/categories/${catId}`, {
      method: "PUT", body: JSON.stringify({ name: "Snacks" }),
    })
    expect(u1.status).toBe(200)

    // Delete
    const d1 = await authed(`/api/houses/1/categories/${catId}`, { method: "DELETE" })
    expect(d1.status).toBe(200)
  })
})

describe("bill templates", () => {
  it("CRUD bill templates", async () => {
    const { authed } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Tpl House" }) })

    // Create template
    const c1 = await authed("/api/bill-templates", {
      method: "POST", body: JSON.stringify({
        house_id: 1, title: "Monthly Rent", amount: 2000, split_type: "均摊", cron_expr: "0 0 1 * *",
      }),
    })
    expect(c1.status).toBe(200)
    const tpl = await c1.json()
    expect(tpl.data.title).toBe("Monthly Rent")
    const tplId = tpl.data.id

    // List
    const list = await authed("/api/bill-templates?house_id=1")
    expect(list.status).toBe(200)

    // Delete
    const d1 = await authed(`/api/bill-templates/${tplId}`, { method: "DELETE" })
    expect(d1.status).toBe(200)
  })
})

describe("stats, reports, ranking", () => {
  it("returns stats, reports, and ranking with data", async () => {
    const { authed, sql } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Stats House" }) })
    await sql("INSERT INTO users (id, wechat_openid, nickname) VALUES (2, 'u2', 'U2')")
    await sql("INSERT INTO members (house_id, user_id, role) VALUES (1, 2, '普通成员')")

    // Create 2 confirmed bills
    for (let i = 1; i <= 2; i++) {
      const b = await authed("/api/bills", { method: "POST", body: JSON.stringify({
        house_id: 1, title: `Bill ${i}`, total_amount: 1000 * i,
        bill_date: "2026-07-01", split_type: "均摊",
        splits: [{ user_id: 1 }, { user_id: 2 }],
      }) })
      const bill = await b.json()
      await authed(`/api/bills/${bill.data.id}/confirm`, { method: "POST" })
    }

    // Stats trend
    const trend = await authed("/api/houses/1/stats/trend")
    expect(trend.status).toBe(200)

    // Reports
    const rep = await authed("/api/houses/1/reports?start=2026-07-01&end=2026-07-31")
    expect(rep.status).toBe(200)

    // Ranking
    const rank = await authed("/api/houses/1/ranking")
    expect(rank.status).toBe(200)
  })
})

describe("notifications", () => {
  it("lists notifications", async () => {
    const { authed } = await createTestApp()

    await authed("/api/houses", { method: "POST", body: JSON.stringify({ name: "Notif House" }) })

    // Seed a notification directly (KV-based, not DB)
    // Notifications are KV-based with key pattern `notifications:{userId}`
    // Since our mock KV returns null, it will be an empty list
    const list = await authed("/api/notifications")
    expect(list.status).toBe(200)
    const listData = await list.json()
    expect(Array.isArray(listData.data)).toBe(true)
  })
})
