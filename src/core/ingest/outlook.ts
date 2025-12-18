const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const SCOPES = ['offline_access', 'Mail.Read']

function requireEnv(name: string) {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var ${name}`)
  return val
}

export function buildOutlookAuthUrl(state: string) {
  const clientId = requireEnv('AZURE_AD_CLIENT_ID')
  const redirectUri = requireEnv('AZURE_AD_REDIRECT_URI')
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state,
    prompt: 'select_account',
  })
  return `${AUTHORITY}/authorize?${params.toString()}`
}

async function tokenRequest(body: Record<string, string>) {
  const clientId = requireEnv('AZURE_AD_CLIENT_ID')
  const clientSecret = requireEnv('AZURE_AD_CLIENT_SECRET')
  const redirectUri = requireEnv('AZURE_AD_REDIRECT_URI')

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    ...body,
  })

  const res = await fetch(`${AUTHORITY}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Outlook token request failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<{
    token_type: string
    scope: string
    expires_in: number
    ext_expires_in?: number
    access_token: string
    refresh_token?: string
    id_token?: string
  }>
}

export async function exchangeOutlookCode(code: string) {
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
  })
}

export async function refreshOutlookToken(refreshToken: string) {
  return tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

export interface OutlookMessage {
  id: string
  subject: string
  bodyPreview: string
  body: { content: string; contentType: 'text' | 'html' }
  from: { emailAddress: { name: string; address: string } }
  receivedDateTime: string
  conversationId?: string
}

export async function fetchOutlookMessages(accessToken: string, top = 20): Promise<OutlookMessage[]> {
  const res = await fetch(`${GRAPH_BASE}/me/messages?$top=${top}&$select=id,subject,bodyPreview,body,from,receivedDateTime`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="text"',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Outlook messages fetch failed: ${res.status} ${text}`)
  }
  const data = await res.json() as { value: OutlookMessage[] }
  return data.value || []
}
