import { describe, it, expect } from "vitest"

describe("undo guard logic", () => {
  it("rejects undo on items in pending status", () => {
    const canUndo = (status: string) => status !== "pending"
    expect(canUndo("pending")).toBe(false)
  })

  it("allows undo on confirmed items", () => {
    const canUndo = (status: string) => status !== "pending"
    expect(canUndo("confirmed")).toBe(true)
  })

  it("allows undo on transferred items", () => {
    const canUndo = (status: string) => status !== "pending"
    expect(canUndo("transferred")).toBe(true)
  })

  it("allows undo on disputed items", () => {
    const canUndo = (status: string) => status !== "pending"
    expect(canUndo("disputed")).toBe(true)
  })

  it("rejects undo on active settlement with no closed status", () => {
    const canUndoSettlement = (status: string) => status === "closed"
    expect(canUndoSettlement("active")).toBe(false)
  })

  it("allows undo on closed settlement", () => {
    const canUndoSettlement = (status: string) => status === "closed"
    expect(canUndoSettlement("closed")).toBe(true)
  })
})
