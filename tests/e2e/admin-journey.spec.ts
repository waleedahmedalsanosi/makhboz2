/**
 * TC-S02-E2E-001 @p1
 * Admin journey: login → navigate to bakers list → verify baker
 */
import { test, expect } from '@playwright/test'
import { createBaker, createUser, cleanupUsers, prisma } from '../support/factories'

test.describe('TC-S02-E2E-001: Admin journey — verify baker @p1', () => {
  let adminEmail: string
  let bakerEmail: string
  const bakerName = `خبازة غير موثقة ${Date.now()}`

  test.beforeAll(async () => {
    // Create a fresh admin user so credentials are known
    adminEmail = `admin-e2e-${Date.now()}@test.local`
    await createUser({ email: adminEmail, role: 'ADMIN', password: 'Password123' })

    // Create an unverified baker to verify in the test
    const { user } = await createBaker(
      { name: bakerName },
      { area: 'الخرطوم', isVerified: false }
    )
    bakerEmail = user.email
  })

  test.afterAll(async () => {
    await cleanupUsers([adminEmail, bakerEmail].filter(Boolean))
  })

  test('admin logs in and verifies a baker', async ({ page }) => {
    // ── 1. Sign in as admin ────────────────────────────────────────────────
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(adminEmail)
    await page.locator('input[name="password"]').fill('Password123')
    await page.getByRole('button', { name: 'دخول' }).click()
    await page.waitForURL('/')

    // ── 2. Navigate to admin bakers list ──────────────────────────────────
    await page.goto('/admin/bakers')
    await expect(page.getByText(bakerName)).toBeVisible({ timeout: 10_000 })

    // ── 3. Click verify for this baker ────────────────────────────────────
    const bakerRow = page.locator('tr', { hasText: bakerName })
    await bakerRow.getByRole('button', { name: 'توثيق' }).click()

    // ── 4. Assert baker is now verified ───────────────────────────────────
    await expect(bakerRow.getByRole('button', { name: /موثق/ })).toBeVisible({
      timeout: 10_000,
    })

    // Double-check DB state
    const baker = await prisma.baker.findFirstOrThrow({
      where: { user: { email: bakerEmail } },
    })
    expect(baker.isVerified).toBe(true)
  })
})
