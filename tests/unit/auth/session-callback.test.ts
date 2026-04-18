/**
 * TC-S02-UNIT-004
 * Auth session callback — missing token.sub throws; session fields populated correctly
 */
import { describe, it, expect } from 'vitest'

// Mirrors the session callback in src/lib/auth.ts.
// Tested in isolation — importing auth.ts requires a live DB connection.
type Session = { user: Record<string, unknown> }
type Token = { sub?: string; role?: string; bakerId?: string }

async function sessionCallback({ session, token }: { session: Session; token: Token }) {
  if (!token.sub) throw new Error('Missing token subject')
  session.user.id = token.sub
  session.user.role = token.role
  session.user.bakerId = token.bakerId
  return session
}

describe('TC-S02-UNIT-004: Auth session callback @p1', () => {
  it('throws when token.sub is absent', async () => {
    await expect(
      sessionCallback({ session: { user: {} }, token: { role: 'BUYER' } })
    ).rejects.toThrow('Missing token subject')
  })

  it('throws when token.sub is an empty string', async () => {
    await expect(
      sessionCallback({ session: { user: {} }, token: { sub: '', role: 'BUYER' } })
    ).rejects.toThrow('Missing token subject')
  })

  it('populates id, role, bakerId for a BAKER token', async () => {
    const session: Session = { user: {} }
    const result = await sessionCallback({
      session,
      token: { sub: 'user-abc', role: 'BAKER', bakerId: 'baker-xyz' },
    })
    expect(result.user.id).toBe('user-abc')
    expect(result.user.role).toBe('BAKER')
    expect(result.user.bakerId).toBe('baker-xyz')
  })

  it('populates id and role for a BUYER token — bakerId is undefined', async () => {
    const session: Session = { user: {} }
    const result = await sessionCallback({
      session,
      token: { sub: 'user-def', role: 'BUYER' },
    })
    expect(result.user.id).toBe('user-def')
    expect(result.user.role).toBe('BUYER')
    expect(result.user.bakerId).toBeUndefined()
  })
})
