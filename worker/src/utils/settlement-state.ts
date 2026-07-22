export type SettlementState = "pending" | "confirmed" | "transferred" | "disputed_transfer"
export type ItemState = "pending" | "confirmed" | "transferred" | "disputed"
export type ChallengeState = "open" | "resolved" | "rejected" | "timeout"

export function canConfirm(state: SettlementState): boolean {
  return state === "pending"
}
