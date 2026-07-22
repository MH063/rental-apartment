import { describe, it, expect } from "vitest"
import { splitEqual, splitByWeight, splitByTier } from "../src/algorithms/split"

describe("splitEqual", () => {
  it("divides amount equally with remainder", () => {
    expect(splitEqual(100, 3)).toEqual([34, 33, 33])
  })

  it("handles exact division", () => {
    expect(splitEqual(100, 4)).toEqual([25, 25, 25, 25])
  })

  it("handles single person", () => {
    expect(splitEqual(100, 1)).toEqual([100])
  })
})

describe("splitByWeight", () => {
  it("splits by weight proportion", () => {
    expect(splitByWeight(100, [1, 2, 1])).toEqual([25, 50, 25])
  })

  it("handles all zero weights", () => {
    expect(splitByWeight(100, [0, 0])).toEqual([0, 0])
  })
})

describe("splitByTier", () => {
  it("calculates tiered pricing", () => {
    const tiers = [{ threshold: 50, rate: 1 }, { threshold: 100, rate: 2 }]
    const result = splitByTier(300, [100, 100], tiers)
    expect(result.reduce((a, b) => a + b, 0)).toBe(300)
  })
})
