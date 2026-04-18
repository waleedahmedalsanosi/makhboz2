/**
 * TC-S01-P0-004, TC-S01-P0-005
 * Payment proof URL validation — Cloudinary origin enforcement
 */
import { test, expect, createBaker, createProduct, createOrder, prisma } from '../../support/fixtures'
import { authHeaders } from '../../support/auth/sign-in'

test.describe('Payment proof URL validation @p0', () => {
  test('TC-S01-P0-004: non-Cloudinary URL rejected with 400', async ({ request }) => {
    const { user, baker } = await createBaker({}, { isVerified: true })
    const product = await createProduct(baker.id)

    const buyerEmail = process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local'
    const buyerUser = await prisma.user.findUnique({ where: { email: buyerEmail } })
    if (!buyerUser) { test.skip(true, 'No BUYER user seeded'); return }

    const order = await createOrder(buyerUser.id, [{ productId: product.id, quantity: 1, price: product.price }])
    const { cookie } = await authHeaders(request, 'BUYER')

    const res = await request.patch(`/api/orders/${order.id}`, {
      headers: { cookie },
      data: { paymentProofUrl: 'https://evil.com/fake-proof.jpg' },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  test('TC-S01-P0-005: valid Cloudinary URL accepted → paymentStatus PROOF_SUBMITTED', async ({ request }) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'testcloud'
    const { user, baker } = await createBaker({}, { isVerified: true })
    const product = await createProduct(baker.id)

    const buyerEmail = process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local'
    const buyerUser = await prisma.user.findUnique({ where: { email: buyerEmail } })
    if (!buyerUser) { test.skip(true, 'No BUYER user seeded'); return }

    const order = await createOrder(buyerUser.id, [{ productId: product.id, quantity: 1, price: product.price }])
    const { cookie } = await authHeaders(request, 'BUYER')

    const validUrl = `https://res.cloudinary.com/${cloudName}/image/authenticated/v123/makhboz/proofs/proof.jpg`

    const res = await request.patch(`/api/orders/${order.id}`, {
      headers: { cookie },
      data: { paymentProofUrl: validUrl },
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.paymentStatus).toBe('PROOF_SUBMITTED')
    expect(body.paymentProofUrl).toBe(validUrl)

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })
})
