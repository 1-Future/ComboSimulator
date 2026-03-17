import { createHmac } from 'node:crypto'

function base64url(str) {
  return Buffer.from(str).toString('base64url')
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString()
}

export function sign(payload, secret, expiresInSeconds = 86400 * 7) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds }))
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

export function verify(token, secret) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  if (signature !== expected) return null
  try {
    const payload = JSON.parse(base64urlDecode(body))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
