import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'marketplace-orders'
const USERS_STORE = 'marketplace-users'
const PRODUCTS_STORE = 'marketplace-products'

function generateId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const usersStore = getStore({ name: USERS_STORE, consistency: 'strong' })
  const tokenData = await usersStore.get(`token-${token}`, { type: 'json' }) as Record<string, string> | null
  if (!tokenData) return null
  return await usersStore.get(`user-${tokenData.userId}`, { type: 'json' }) as Record<string, any> | null
}

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const orderId = url.searchParams.get('id')
    if (orderId) {
      const order = await store.get(`order-${orderId}`, { type: 'json' }) as Record<string, any> | null
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
      // Customer can see their orders, baker can see orders containing their products
      if (order.customerId !== user.id && !order.items?.some((i: any) => i.bakerId === user.id)) {
        return Response.json({ error: 'غير مصرح' }, { status: 403 })
      }
      return Response.json(order)
    }

    // List orders for user
    let indexKey = user.role === 'baker' ? `baker-orders-${user.id}` : `customer-orders-${user.id}`
    const orderIds = (await store.get(indexKey, { type: 'json' }) as string[] | null) || []

    const orders: any[] = []
    for (const oid of orderIds) {
      const o = await store.get(`order-${oid}`, { type: 'json' }) as Record<string, any> | null
      if (o) orders.push(o)
    }
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return Response.json({ orders })
  }

  if (req.method === 'POST') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'يجب تسجيل الدخول لإتمام الطلب' }, { status: 401 })

    const body = await req.json() as Record<string, any>

    // Update order status (for bakers)
    if (body.action === 'updateStatus') {
      const { orderId, status } = body
      const order = await store.get(`order-${orderId}`, { type: 'json' }) as Record<string, any> | null
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })

      const validStatuses = ['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) return Response.json({ error: 'حالة غير صالحة' }, { status: 400 })

      order.status = status
      order.updatedAt = new Date().toISOString()
      await store.setJSON(`order-${orderId}`, order)
      return Response.json(order)
    }

    // Create new order
    const { items, area, address, paymentMethod, notes } = body
    if (!items || !items.length) return Response.json({ error: 'السلة فارغة' }, { status: 400 })
    if (!address) return Response.json({ error: 'العنوان مطلوب' }, { status: 400 })

    // Validate items and calculate total
    const productStore = getStore({ name: PRODUCTS_STORE, consistency: 'strong' })
    let total = 0
    const validatedItems: any[] = []
    const bakerIds = new Set<string>()

    for (const item of items) {
      const product = await productStore.get(`product-${item.id}`, { type: 'json' }) as Record<string, any> | null
      if (!product || !product.available) continue
      const itemTotal = product.price * item.qty
      total += itemTotal
      bakerIds.add(product.bakerId)
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        bakerId: product.bakerId,
        bakerName: product.bakerName,
        price: product.price,
        unit: product.unit,
        qty: item.qty,
        itemTotal
      })
    }

    if (!validatedItems.length) return Response.json({ error: 'لم يتم العثور على منتجات صالحة' }, { status: 400 })

    const orderId = generateId()
    const order = {
      id: orderId,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      items: validatedItems,
      total,
      area: area || user.area,
      address,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await store.setJSON(`order-${orderId}`, order)

    // Update customer order index
    const custIndex = (await store.get(`customer-orders-${user.id}`, { type: 'json' }) as string[] | null) || []
    custIndex.push(orderId)
    await store.setJSON(`customer-orders-${user.id}`, custIndex)

    // Update baker order indexes
    for (const bakerId of bakerIds) {
      const bakerIndex = (await store.get(`baker-orders-${bakerId}`, { type: 'json' }) as string[] | null) || []
      bakerIndex.push(orderId)
      await store.setJSON(`baker-orders-${bakerId}`, bakerIndex)
    }

    return Response.json(order)
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/orders',
}
