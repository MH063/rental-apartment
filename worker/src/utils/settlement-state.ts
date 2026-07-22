export type SettlementState = "active" | "closed"
export type ItemState = "pending" | "confirmed" | "transferred" | "disputed"
export type ChallengeState = "open" | "resolved" | "timeout"

export function canConfirm(state: SettlementState): boolean {
  return state === "active"
}

export function canChallenge(state: SettlementState): boolean {
  return state === "active"
}
