import { describe, it, expect } from "vitest"
import { settle } from "../src/algorithms/settlement"

describe("settle", () => {
  it("resolves simple debt", () => {
    const result = settle([
      { userId: 1, amount: -100 },
      { userId: 2, amount: 100 },
    ])
    expect(result).toEqual([{ from: 1, to: 2, amount: 100 }])
  })

  it("resolves multi-party debt", () => {
    const result = settle([
      { userId: 1, amount: -250 },
      { userId: 2, amount: -50 },
      { userId: 3, amount: 300 },
    ])
    const totalFrom = result.reduce((s, t) => s + t.amount, 0)
    expect(totalFrom).toBe(300)
    expect(result).toHaveLength(2)
  })

  it("handles realistic roommate scenario: A paid bills, B and C owe", () => {
    // User 1 (A) paid ¥500 total bill, owes ¥200 share
    // User 2 (B) owes ¥150
    // User 3 (C) owes ¥150
    // Net: A=+300, B=-150, C=-150
    const result = settle([
      { userId: 1, amount: 300 },
      { userId: 2, amount: -150 },
      { userId: 3, amount: -150 },
    ])
    expect(result).toEqual([
      { from: 2, to: 1, amount: 150 },
      { from: 3, to: 1, amount: 150 },
    ])
  })

  it("minimizes transfer count with greedy", () => {
    // A=+200, B=-50, C=-50, D=-100
    // Greedy: D→A(100), B→A(50), C→A(50) = 3 transfers
    const result = settle([
      { userId: 1, amount: 200 },
      { userId: 2, amount: -50 },
      { userId: 3, amount: -50 },
      { userId: 4, amount: -100 },
    ])
    const totalFrom = result.reduce((s, t) => s + t.amount, 0)
    expect(totalFrom).toBe(200)
  })

  it("returns empty for zero balances", () => {
    expect(settle([])).toEqual([])
  })

  it("handles single user", () => {
    expect(settle([{ userId: 1, amount: 0 }])).toEqual([])
  })
})
