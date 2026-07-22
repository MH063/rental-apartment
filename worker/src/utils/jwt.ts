const encoder = new TextEncoder()

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(input: string): string {
  input = input.replace(/-/g, "+").replace(/_/g, "/")
  while (input.length % 4) input += "="
  return atob(input)
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return b64url(String.fromCharCode(...new Uint8Array(sig)))
}

export async function sign(payload: Record<string, unknown>, secret: string, expiresInSec: number): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec }))
  const sig = await hmacSign(`${header}.${body}`, secret)
  return `${header}.${body}.${sig}`
}

export async function verify(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const sig = await hmacSign(`${parts[0]}.${parts[1]}`, secret)
  if (sig !== parts[2]) return null
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function decode(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    return JSON.parse(b64urlDecode(parts[1]))
  } catch {
    return null
  }
}
