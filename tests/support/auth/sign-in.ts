import type { APIRequestContext } from '@playwright/test'

export type Role = 'BUYER' | 'BAKER' | 'ADMIN'

const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  BUYER: {
    email: process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local',
    password: process.env.TEST_BUYER_PASSWORD ?? 'Password123',
  },
  BAKER: {
    email: process.env.TEST_BAKER_EMAIL ?? 'baker@test.local',
    password: process.env.TEST_BAKER_PASSWORD ?? 'Password123',
  },
  ADMIN: {
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@test.local',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'Password123',
  },
}

function parseSetCookie(raw: string): string {
  return raw
    .split('\n')
    .map(line => line.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')
}

/**
 * Signs in via NextAuth credentials endpoint and returns the session cookie header.
 * Uses the CSRF token flow required by NextAuth v5.
 */
export async function signIn(
  request: APIRequestContext,
  role: Role = 'BUYER'
): Promise<string> {
  const { email, password } = CREDENTIALS[role]

  // Step 1: get CSRF token
  const csrfRes = await request.get('/api/auth/csrf')
  const { csrfToken } = await csrfRes.json() as { csrfToken: string }
  const csrfCookie = parseSetCookie(csrfRes.headers()['set-cookie'] ?? '')

  // Step 2: sign in with credentials
  const signInRes = await request.post('/api/auth/callback/credentials', {
    form: { email, password, csrfToken },
    headers: { cookie: csrfCookie },
    maxRedirects: 0,
  })

  const rawSessionCookie = signInRes.headers()['set-cookie'] ?? ''
  if (!rawSessionCookie.includes('authjs.session-token')) {
    throw new Error(`Sign-in failed for role ${role} (${email}). Check test credentials.`)
  }
  return parseSetCookie(rawSessionCookie)
}

/**
 * Returns Authorization-style headers with session cookie for API calls.
 */
export async function authHeaders(
  request: APIRequestContext,
  role: Role = 'BUYER'
): Promise<{ cookie: string }> {
  const cookie = await signIn(request, role)
  return { cookie }
}
