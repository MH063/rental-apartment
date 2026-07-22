export function splitEqual(total: number, count: number): number[] {
  const per = Math.floor(total / count)
  const remainder = total - per * count
  return Array.from({ length: count }, (_, i) => per + (i < remainder ? 1 : 0))
}

export function splitByWeight(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return weights.map(() => 0)
  let remaining = total
  const result = weights.map((w, i) => {
    const amount = i === weights.length - 1 ? remaining : Math.floor((w / sum) * total)
    remaining -= amount
    return Math.max(0, amount)
  })
  return result
}

export function splitByDays(total: number, days: number[]): number[] {
  return splitByWeight(total, days)
}

export function splitByUsage(total: number, usage: number[]): number[] {
  return splitByWeight(total, usage)
}

export function splitByArea(total: number, areas: number[]): number[] {
  return splitByWeight(total, areas)
}

export interface SplitTier {
  threshold: number
  rate: number
}

export function splitByTier(total: number, usage: number[], tiers: SplitTier[]): number[] {
  const amounts = usage.map((u) => {
    let remaining = u
    let cost = 0
    for (const tier of tiers) {
      const used = Math.min(remaining, tier.threshold)
      cost += used * tier.rate
      remaining -= used
      if (remaining <= 0) break
    }
    return cost
  })
  const sum = amounts.reduce((a, b) => a + b, 0)
  if (sum === 0) return usage.map(() => 0)
  const ratio = total / sum
  let remaining = total
  return amounts.map((a, i) => {
    const amount = i === amounts.length - 1 ? remaining : Math.floor(a * ratio)
    remaining -= amount
    return Math.max(0, amount)
  })
}
