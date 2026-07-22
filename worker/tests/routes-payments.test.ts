import { describe, it, expect } from "vitest"
import { createTestApp } from "./helper"

describe("payment methods integration", () => {
  it("creates, lists, updates, and deletes payment methods", async () => {
    const { authed } = await createTestApp()

    // Create
    const c1 = await authed("/api/payment-methods", {
      method: "POST",
      body: JSON.stringify({ type: "支付宝", account: "alice@alipay.com" }),
    })
    expect(c1.status).toBe(200)
    const pay = await c1.json()
    expect(pay.data.type).toBe("支付宝")

    const pid = pay.data.id

    // List
    const list = await authed("/api/payment-methods")
    expect(list.status).toBe(200)
    const data = await list.json()
    expect(data.data.length).toBeGreaterThanOrEqual(1)

    // Update
    const u1 = await authed(`/api/payment-methods/${pid}`, {
      method: "PUT",
      body: JSON.stringify({ account: "alice_new@alipay.com" }),
    })
    expect(u1.status).toBe(200)

    // Delete
    const d1 = await authed(`/api/payment-methods/${pid}`, { method: "DELETE" })
    expect(d1.status).toBe(200)
  })
})
