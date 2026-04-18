/**
 * TC-S01-P0-010 through TC-S01-P0-012, TC-S02-P1-009 through TC-S02-P1-012
 * Orders — server-side total, status transitions, ownership, cancellation
 */
import { test, expect, createBaker, createProduct, createOrder, prisma } from '../../support/fixtures'
import { authHeaders } from '../../support/auth/sign-in'

test.describe('Orders API', () => {
  test('TC-S01-P0-010: server recalculates total regardless of client value @p0', async ({ request }) => {
    const { user, baker } = await createBaker()
    const product = await createProduct(baker.id, { price: 100 })
    const { cookie } = await authHeaders(request, 'BUYER')

    const res = await request.post('/api/orders', {
      headers: { cookie },
      data: {
        items: [{ productId: product.id, quantity: 2 }],
        deliveryAddress: 'شارع الجامعة، الخرطوم',
        total: 9999,  // client sends inflated total
      },
    })

    expect(res.status()).toBe(201)
    const order = await res.json()
    expect(order.total).toBe(200) // 100 * 2 — server value, not client

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  test('TC-S02-P1-009: order with unavailable product → 400 @p1', async ({ request }) => {
    const { user, baker } = await createBaker()
    const product = await createProduct(baker.id, { isAvailable: false })
    const { cookie } = await authHeaders(request, 'BUYER')

    const res = await request.post('/api/orders', {
      headers: { cookie },
      data: {
        items: [{ productId: product.id, quantity: 1 }],
        deliveryAddress: 'شارع الجامعة',
      },
    })

    expect(res.status()).toBe(400)

    await prisma.user.delete({ where: { id: user.id } })
  })

  test('TC-S02-P1-010: buyer cancels PENDING order @p1', async ({ request }) => {
    const buyerCreds = await authHeaders(request, 'BUYER')
    const { user, baker } = await createBaker()
    const product = await createProduct(baker.id)

    const buyerEmail = process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local'
    const buyerUser = await prisma.user.findUnique({ where: { email: buyerEmail } })
    if (!buyerUser) { test.skip(true, 'No BUYER user seeded'); return }

    const order = await createOrder(buyerUser.id, [{ productId: product.id, quantity: 1, price: product.price }])

    const res = await request.patch(`/api/orders/${order.id}`, {
      headers: buyerCreds,
      data: { status: 'CANCELLED' },
    })

    expect(res.status()).toBe(200)
    const updated = await res.json()
    expect(updated.status).toBe('CANCELLED')

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  test('TC-S01-P0-011: baker cannot set order status to CANCELLED → 400 @p0', async ({ request }) => {
    const bakerEmail = process.env.TEST_BAKER_EMAIL ?? 'baker@test.local'
    const bakerUser = await prisma.user.findUnique({ where: { email: bakerEmail } })
    if (!bakerUser) { test.skip(true, 'No BAKER user seeded'); return }
    const bakerRecord = await prisma.baker.findUnique({ where: { userId: bakerUser.id } })
    if (!bakerRecord) { test.skip(true, 'No Baker record for test baker'); return }

    const product = await createProduct(bakerRecord.id)

    const buyerEmail = process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local'
    const buyerUser = await prisma.user.findUnique({ where: { email: buyerEmail } })
    if (!buyerUser) { test.skip(true, 'No BUYER user seeded'); return }

    const order = await createOrder(buyerUser.id, [{ productId: product.id, quantity: 1, price: product.price }])
    const { cookie } = await authHeaders(request, 'BAKER')

    const res = await request.patch(`/api/orders/${order.id}`, {
      headers: { cookie },
      data: { status: 'CANCELLED' },
    })

    expect(res.status()).toBe(400)

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.product.delete({ where: { id: product.id } })
  })

  test('TC-S01-P0-012: baker cannot PATCH another baker\'s order → 404 @p0', async ({ request }) => {
    const { user: baker1User, baker: baker1 } = await createBaker({}, { isVerified: true })
    const { user: baker2User, baker: baker2 } = await createBaker({}, { isVerified: true })
    const product = await createProduct(baker1.id) // belongs to baker1

    const buyerUser = await prisma.user.findFirst({ where: { role: 'BUYER' } })
    if (!buyerUser) { test.skip(true, 'No BUYER user seeded'); return }

    const order = await createOrder(buyerUser.id, [{ productId: product.id, quantity: 1, price: product.price }])

    // baker2 tries to update baker1's order
    const { cookie } = await authHeaders(request, 'BAKER')

    const res = await request.patch(`/api/orders/${order.id}`, {
      headers: { cookie },
      data: { status: 'ACCEPTED' },
    })

    expect(res.status()).toBe(404)

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.deleteMany({ where: { id: { in: [baker1User.id, baker2User.id] } } })
  })
})
