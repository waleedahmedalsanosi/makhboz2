/**
 * TC-S01-E2E-002 @p0
 * Full baker journey: register → create product → accept order → deliver
 *
 * The buyer order is created directly via Prisma factory after the baker
 * creates a product — testing the full baker-side order management UI.
 *
 * /api/upload is mocked for the product image step so the test runs
 * without real Cloudinary credentials.
 */
import { test, expect } from '@playwright/test'
import {
  createUser,
  createOrder,
  cleanupUser,
  cleanupUsers,
  prisma,
} from '../support/factories'

test.describe('TC-S01-E2E-002: Full baker journey @p0', () => {
  let bakerEmail: string
  let buyerEmail: string
  const productName = `كعك ${Date.now()}`

  test.afterAll(async () => {
    const emails = [bakerEmail, buyerEmail].filter(Boolean)
    await cleanupUsers(emails)
  })

  test('register baker → create product → accept → prepare → deliver', async ({ page }) => {
    bakerEmail = `baker-e2e-${Date.now()}@test.local`
    const password = 'Password123'

    // ── 1. Register as baker ───────────────────────────────────────────────
    await page.goto('/register')
    await page.locator('label', { hasText: 'صانعة' }).click()
    await page.locator('input[name="name"]').fill('خبازة تجريبية')
    await page.locator('input[name="email"]').fill(bakerEmail)
    await page.locator('input[name="phone"]').fill('0912345678')
    await page.locator('input[name="area"]').fill('أم درمان')
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'إنشاء حساب' }).click()
    await page.waitForURL(/\/login/)

    // ── 2. Sign in ─────────────────────────────────────────────────────────
    await page.locator('input[name="email"]').fill(bakerEmail)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'دخول' }).click()
    await page.waitForURL('/')

    // ── 3. Create product via dashboard ────────────────────────────────────
    await page.goto('/dashboard/products/new')

    // Mock /api/upload so product image upload doesn't need Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'testcloud'
    const fakeImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v123/makhboz/products/img.jpg`
    await page.route('/api/upload', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: fakeImageUrl }),
      })
    )

    await page.locator('input[name="name"]').fill(productName)
    await page.locator('input[name="price"]').fill('150')
    await page.locator('input[name="unit"]').fill('كيلو')
    // Native select for category
    await page.locator('select[name="category"]').selectOption({ label: 'كعك' })
    await page.locator('input[name="area"]').fill('أم درمان')
    await page.getByRole('button', { name: 'حفظ المنتج' }).click()

    // Wait for redirect after saving
    await page.waitForURL(/\/dashboard\/products/, { timeout: 15_000 })

    // ── 4. Create buyer order via Prisma factory ───────────────────────────
    const bakerUser = await prisma.user.findUniqueOrThrow({
      where: { email: bakerEmail },
      include: { baker: true },
    })
    const product = await prisma.product.findFirstOrThrow({
      where: { bakerId: bakerUser.baker[0].id, name: productName },
    })

    const buyer = await createUser({ role: 'BUYER' })
    buyerEmail = buyer.email
    await createOrder(buyer.id, [{ productId: product.id, quantity: 2, price: product.price }])

    // ── 5. Navigate to orders and accept ──────────────────────────────────
    await page.goto('/dashboard/orders')
    await expect(page.getByText(productName).first()).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'قبول الطلب' }).first().click()
    await expect(page.getByRole('button', { name: 'بدء التحضير' }).first()).toBeVisible({
      timeout: 10_000,
    })

    // ── 6. Prepare ─────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'بدء التحضير' }).first().click()
    await expect(page.getByRole('button', { name: 'تسليم الطلب' }).first()).toBeVisible({
      timeout: 10_000,
    })

    // ── 7. Deliver ─────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'تسليم الطلب' }).first().click()
    await expect(page.getByText('تم التسليم').first()).toBeVisible({ timeout: 10_000 })
  })
})
