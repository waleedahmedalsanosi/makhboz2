/**
 * TC-S01-E2E-001 @p0
 * Full buyer journey: register → browse product → add to cart → checkout → upload payment proof
 *
 * /api/upload is mocked to return a valid Cloudinary URL so the test runs
 * without real Cloudinary credentials while still exercising the full
 * PATCH /api/orders/:id proof-submission path against the real DB.
 */
import { test, expect } from '@playwright/test'
import {
  createBaker,
  createProduct,
  cleanupUser,
  cleanupUsers,
  prisma,
} from '../support/factories'

const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k=',
  'base64'
)

test.describe('TC-S01-E2E-001: Full buyer journey @p0', () => {
  let bakerEmail: string
  let buyerEmail: string
  const productName = `كعك بالسمسم ${Date.now()}`

  test.beforeAll(async () => {
    const { user, baker } = await createBaker(
      {},
      {
        area: 'الخرطوم',
        bankName: 'بنك الخرطوم',
        bankAccount: '00123456789',
        isVerified: true,
      }
    )
    bakerEmail = user.email
    await createProduct(baker.id, {
      name: productName,
      price: 100,
      category: 'KAAK',
      area: 'الخرطوم',
      isAvailable: true,
    })
  })

  test.afterAll(async () => {
    const emails = [bakerEmail, buyerEmail].filter(Boolean)
    await cleanupUsers(emails)
  })

  test('register → browse → order → upload proof', async ({ page }) => {
    buyerEmail = `buyer-e2e-${Date.now()}@test.local`
    const password = 'Password123'

    // ── 1. Register new buyer ──────────────────────────────────────────────
    await page.goto('/register')
    await page.locator('label', { hasText: 'مشتري' }).click()
    await page.locator('input[name="name"]').fill('مشترٍ تجريبي')
    await page.locator('input[name="email"]').fill(buyerEmail)
    await page.locator('input[name="phone"]').fill('0912345678')
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'إنشاء حساب' }).click()

    await page.waitForURL(/\/login/)

    // ── 2. Sign in ─────────────────────────────────────────────────────────
    await page.locator('input[name="email"]').fill(buyerEmail)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'دخول' }).click()
    await page.waitForURL('/')

    // ── 3. Browse home and click product ──────────────────────────────────
    await expect(page.getByText(productName).first()).toBeVisible({ timeout: 10_000 })
    await page.getByText(productName).first().click()
    await page.waitForURL(/\/products\//)

    // ── 4. Add to cart ────────────────────────────────────────────────────
    await page.getByRole('button', { name: /أضف إلى السلة/ }).click()

    // ── 5. CartDrawer: proceed to checkout ────────────────────────────────
    await expect(page.getByRole('button', { name: 'إتمام الطلب' })).toBeVisible()
    await page.getByRole('button', { name: 'إتمام الطلب' }).click()
    await page.waitForURL('/checkout')

    // ── 6. Fill delivery address and confirm order ─────────────────────────
    await page.getByPlaceholder('الحي، الشارع، رقم المنزل...').fill('حي الرياض، شارع 15، منزل 3')
    await page.getByRole('button', { name: /تأكيد الطلب/ }).click()

    // ── 7. Success screen ─────────────────────────────────────────────────
    await expect(page.getByText('تم إنشاء طلبك!')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('link', { name: 'رفع إثبات الدفع' }).click()
    await page.waitForURL(/\/orders\//)

    // ── 8. Mock /api/upload → return valid Cloudinary URL ─────────────────
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'testcloud'
    const fakeUrl = `https://res.cloudinary.com/${cloudName}/image/authenticated/v123/makhboz/proofs/proof.jpg`
    await page.route('/api/upload', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: fakeUrl }),
      })
    )

    // ── 9. Upload proof file ───────────────────────────────────────────────
    await page.locator('input[type="file"]').setInputFiles({
      name: 'proof.jpg',
      mimeType: 'image/jpeg',
      buffer: TINY_JPEG,
    })

    await page.getByRole('button', { name: 'إرسال الإثبات' }).click()

    // ── 10. Assert payment status updated to PROOF_SUBMITTED ──────────────
    await expect(page.getByText('إثبات مُرسل')).toBeVisible({ timeout: 15_000 })
  })
})
