export interface MemberBalance {
  userId: number
  amount: number
}

export interface Transfer {
  from: number
  to: number
  amount: number
}

export function settle(balances: MemberBalance[]): Transfer[] {
  const payers = balances.filter((b) => b.amount < 0).map((b) => ({ ...b, amount: -b.amount }))
  const receivers = balances.filter((b) => b.amount > 0).map((b) => ({ ...b }))
  payers.sort((a, b) => b.amount - a.amount)
  receivers.sort((a, b) => b.amount - a.amount)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < payers.length && j < receivers.length) {
    const amount = Math.min(payers[i].amount, receivers[j].amount)
    transfers.push({ from: payers[i].userId, to: receivers[j].userId, amount })
    payers[i].amount -= amount
    receivers[j].amount -= amount
    if (payers[i].amount === 0) i++
    if (receivers[j].amount === 0) j++
  }
  return transfers
}
