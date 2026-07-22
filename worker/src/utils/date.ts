export function nowISO(): string {
  return new Date().toISOString()
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
