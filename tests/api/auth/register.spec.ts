/**
 * TC-S02-P1-001 through TC-S02-P1-004, TC-S01-P0-009
 * Registration endpoint — role validation, area requirements, duplicate email
 */
import { test, expect, prisma } from '../../support/fixtures'

const BASE = '/api/auth/register'

test.describe('POST /api/auth/register', () => {
  const created: string[] = []

  test.afterAll(async () => {
    if (created.length) {
      await prisma.user.deleteMany({ where: { email: { in: created } } })
    }
  })

  test('TC-S02-P1-001: BUYER without area → 201 @p1', async ({ request }) => {
    const email = `buyer-no-area-${Date.now()}@test.local`
    created.push(email)

    const res = await request.post(BASE, {
      data: { name: 'Test Buyer', email, password: 'Password123', phone: '0912345678', role: 'BUYER' },
    })

    expect(res.status()).toBe(201)
  })

  test('TC-S02-P1-002: BAKER without area → 400 @p1', async ({ request }) => {
    const res = await request.post(BASE, {
      data: {
        name: 'Test Baker',
        email: `baker-no-area-${Date.now()}@test.local`,
        password: 'Password123',
        phone: '0912345678',
        role: 'BAKER',
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/منطقة/)
  })

  test('TC-S02-P1-003: BAKER with area → 201 + Baker row created @p1', async ({ request }) => {
    const email = `baker-with-area-${Date.now()}@test.local`
    created.push(email)

    const res = await request.post(BASE, {
      data: { name: 'Test Baker', email, password: 'Password123', phone: '0912345678', role: 'BAKER', area: 'أم درمان' },
    })

    expect(res.status()).toBe(201)

    const baker = await prisma.baker.findFirst({ where: { user: { email } } })
    expect(baker).not.toBeNull()
    expect(baker!.area).toBe('أم درمان')
  })

  test('TC-S02-P1-004: duplicate email → 409 @p1', async ({ request }) => {
    const email = `dup-${Date.now()}@test.local`
    created.push(email)

    await request.post(BASE, {
      data: { name: 'First', email, password: 'Password123', phone: '0912345678', role: 'BUYER' },
    })

    const res = await request.post(BASE, {
      data: { name: 'Second', email, password: 'Password123', phone: '0912345678', role: 'BUYER' },
    })

    expect(res.status()).toBe(409)
  })

  test('TC-S01-P0-009: role ADMIN → 400 @p0', async ({ request }) => {
    const res = await request.post(BASE, {
      data: {
        name: 'Hacker',
        email: `admin-attempt-${Date.now()}@test.local`,
        password: 'Password123',
        phone: '0912345678',
        role: 'ADMIN',
      },
    })

    expect(res.status()).toBe(400)
  })
})
