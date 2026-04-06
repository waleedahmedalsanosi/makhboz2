import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

function generateId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const tokenData = await redis.get<Record<string, string>>(`users:token-${token}`)
  if (!tokenData) return null
  return await redis.get<Record<string, any>>(`users:user-${tokenData.userId}`)
}

export default async function handler(req: Request) {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const orderId = url.searchParams.get('id')
    if (orderId) {
      const order = await redis.get<Record<string, any>>(`orders:order-${orderId}`)
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
      if (order.customerId !== user.id && !order.items?.some((i: any) => i.bakerId === user.id)) {
        return Response.json({ error: 'غير مصرح' }, { status: 403 })
      }
      return Response.json(order)
    }

    const indexKey = user.role === 'baker' ? `orders:baker-orders-${user.id}` : `orders:customer-orders-${user.id}`
    const orderIds = (await redis.get<string[]>(indexKey)) || []

    // Batch-fetch all orders in one round-trip
    let orders: Record<string, any>[] = []
    if (orderIds.length > 0) {
      const keys = orderIds.map(oid => `orders:order-${oid}`)
      const results = await redis.mget<Record<string, any>[]>(...keys)
      orders = results.filter(Boolean) as Record<string, any>[]
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return Response.json({ orders })
  }

  if (req.method === 'POST') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'يجب تسجيل الدخول لإتمام الطلب' }, { status: 401 })

    const body = await req.json() as Record<string, any>

    if (body.action === 'updateStatus') {
      const { orderId, status } = body
      const order = await redis.get<Record<string, any>>(`orders:order-${orderId}`)
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })

      const validStatuses = ['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) return Response.json({ error: 'حالة غير صالحة' }, { status: 400 })

      order.status = status
      order.updatedAt = new Date().toISOString()
      await redis.set(`orders:order-${orderId}`, order)
      return Response.json(order)
    }

    if (body.action === 'cancelOrder') {
      const { orderId } = body
      const order = await redis.get<Record<string, any>>(`orders:order-${orderId}`)
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
      if (order.customerId !== user.id) return Response.json({ error: 'غير مصرح' }, { status: 403 })
      if (!['pending', 'confirmed'].includes(order.status)) {
        return Response.json({ error: 'لا يمكن إلغاء الطلب بعد بدء التحضير' }, { status: 400 })
      }
      order.status = 'cancelled'
      order.updatedAt = new Date().toISOString()
      await redis.set(`orders:order-${orderId}`, order)
      return Response.json(order)
    }

    const { items, area, address, paymentMethod, notes } = body
    if (!items || !items.length) return Response.json({ error: 'السلة فارغة' }, { status: 400 })
    if (!address) return Response.json({ error: 'العنوان مطلوب' }, { status: 400 })

    // Batch-fetch all products at once
    const productKeys = items.map((item: any) => `products:product-${item.id}`)
    const productResults = await redis.mget<Record<string, any>[]>(...productKeys)

    let total = 0
    const validatedItems: any[] = []
    const bakerIds = new Set<string>()
    const bakerPhones: Record<string, string> = {}

    for (let i = 0; i < items.length; i++) {
      const product = productResults[i]
      if (!product || !product.available) continue
      const itemTotal = product.price * items[i].qty
      total += itemTotal
      bakerIds.add(product.bakerId)
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        bakerId: product.bakerId,
        bakerName: product.bakerName,
        price: product.price,
        unit: product.unit,
        qty: items[i].qty,
        itemTotal
      })
    }

    if (!validatedItems.length) return Response.json({ error: 'لم يتم العثور على منتجات صالحة' }, { status: 400 })

    // Fetch baker phones for WhatsApp links
    for (const bakerId of bakerIds) {
      const baker = await redis.get<Record<string, any>>(`users:user-${bakerId}`)
      if (baker?.phone) bakerPhones[bakerId] = baker.phone
    }

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
      bakerPhones,
      createdAt: new Date().toISOString()
    }

    await redis.set(`orders:order-${orderId}`, order)

    const custIndex = (await redis.get<string[]>(`orders:customer-orders-${user.id}`)) || []
    custIndex.push(orderId)
    await redis.set(`orders:customer-orders-${user.id}`, custIndex)

    for (const bakerId of bakerIds) {
      const bakerIndex = (await redis.get<string[]>(`orders:baker-orders-${bakerId}`)) || []
      bakerIndex.push(orderId)
      await redis.set(`orders:baker-orders-${bakerId}`, bakerIndex)
    }

    return Response.json(order)
  }

  return new Response('Method not allowed', { status: 405 })
}
