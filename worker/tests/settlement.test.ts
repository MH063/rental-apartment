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

  it("returns empty for zero balances", () => {
    expect(settle([])).toEqual([])
  })
})
