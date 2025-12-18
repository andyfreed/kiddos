import crypto from 'crypto'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface ConfirmTokenPayload {
  userId: string
  action: string
  args: JsonValue
  createdAt: string
  expiresAt: string
}

function base64UrlEncode(input: Buffer | string) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecodeToString(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function sign(data: string, secret: string) {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(data).digest())
}

function getSecret() {
  const secret =
    process.env.CONFIRM_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('Missing CONFIRM_TOKEN_SECRET (or NEXTAUTH_SECRET/SUPABASE_JWT_SECRET)')
  }
  return secret
}

export function createConfirmToken(payload: ConfirmTokenPayload) {
  const secret = getSecret()
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'KiddosConfirm' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const toSign = `${header}.${body}`
  const sig = sign(toSign, secret)
  return `${toSign}.${sig}`
}

export function verifyConfirmToken(token: string): ConfirmTokenPayload {
  const secret = getSecret()
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid confirm token')
  const [header, body, sig] = parts
  const toSign = `${header}.${body}`
  const expected = sign(toSign, secret)
  if (sig.length !== expected.length) {
    throw new Error('Invalid confirm token signature')
  }
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid confirm token signature')
  }

  const payload = JSON.parse(base64UrlDecodeToString(body)) as ConfirmTokenPayload
  const expiresAt = new Date(payload.expiresAt).getTime()
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
    throw new Error('Confirm token expired')
  }
  return payload
}
