export function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function inviteCodeExpiresAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}
