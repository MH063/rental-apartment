import { describe, it, expect } from "vitest"
import { describe, it, expect } from "vitest"
import { createTestApp, rawRequest } from "./helper"

describe("integration: houses", () => {
  it("creates a house and returns it in the list", async () => {
    const { authed } = await createTestApp()

    const createRes = await authed("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test House", address: "123 Main St" }),
    })
    expect(createRes.status).toBe(200)
    const createData = await createRes.json()
    expect(createData.success).toBe(true)
    expect(createData.data.name).toBe("Test House")
    const houseId = createData.data.id

    const getRes = await authed(`/api/houses/${houseId}`)
    expect(getRes.status).toBe(200)
    const getData = await getRes.json()
    expect(getData.data.name).toBe("Test House")
  })
})

describe("integration: bills", () => {
  it("creates a bill with equal split and confirms it", async () => {
    const { authed } = await createTestApp()

    const houseRes = await authed("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bill Test House" }),
    })
    const house = await houseRes.json()
    const houseId = house.data.id

    const billRes = await authed("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        house_id: houseId,
        title: "Test Bill",
        total_amount: 3000,
        bill_date: "2026-07-01",
        split_type: "均摊",
        splits: [{ user_id: 1, parameter: 1 }],
      }),
    })
    expect(billRes.status).toBe(200)
    const billData = await billRes.json()
    expect(billData.success).toBe(true)
    const billId = billData.data.id
    expect(billData.data.total_amount).toBe(3000)

    const confirmRes = await authed(`/api/bills/${billId}/confirm`, { method: "POST" })
    expect(confirmRes.status).toBe(200)
  })
})

describe("integration: auth", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await rawRequest("/api/houses")
    expect(res.status).toBe(401)
  })
})
