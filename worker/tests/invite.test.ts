import { describe, it, expect } from "vitest"
import { generateInviteCode, isExpired } from "../src/utils/invite"

describe("generateInviteCode", () => {
  it("generates a 6-digit string", () => {
    const code = generateInviteCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it("generates different codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe("isExpired", () => {
  it("returns true for past dates", () => {
    expect(isExpired("2020-01-01T00:00:00.000Z")).toBe(true)
  })

  it("returns false for future dates", () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    expect(isExpired(future)).toBe(false)
  })
})
