import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const USERS_STORE = 'marketplace-users'
const ORDERS_STORE = 'marketplace-orders'
const PRODUCTS_STORE = 'marketplace-products'

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'stats') {
    const usersStore = getStore({ name: USERS_STORE, consistency: 'strong' })
    const ordersStore = getStore({ name: ORDERS_STORE, consistency: 'strong' })
    const productsStore = getStore({ name: PRODUCTS_STORE, consistency: 'strong' })

    // Count users by role
    const phoneIndex = (await usersStore.get('phone-index', { type: 'json' }) as Record<string, string> | null) || {}
    const userIds = Object.values(phoneIndex)
    let customers = 0, bakers = 0, drivers = 0
    for (const uid of userIds) {
      const user = await usersStore.get(`user-${uid}`, { type: 'json' }) as Record<string, any> | null
      if (user) {
        if (user.role === 'customer') customers++
        else if (user.role === 'baker') bakers++
        else if (user.role === 'driver') drivers++
      }
    }

    // Count orders and revenue
    const { blobs: orderBlobs } = await ordersStore.list()
    let totalOrders = 0, totalRevenue = 0
    let pendingOrders = 0, completedOrders = 0
    for (const blob of orderBlobs) {
      if (!blob.key.startsWith('order-')) continue
      const order = await ordersStore.get(blob.key, { type: 'json' }) as Record<string, any> | null
      if (order) {
        totalOrders++
        totalRevenue += order.total || 0
        if (order.status === 'pending') pendingOrders++
        if (order.status === 'delivered') completedOrders++
      }
    }

    // Count products
    const { blobs: productBlobs } = await productsStore.list()
    let totalProducts = 0, activeProducts = 0
    for (const blob of productBlobs) {
      if (!blob.key.startsWith('product-')) continue
      const product = await productsStore.get(blob.key, { type: 'json' }) as Record<string, any> | null
      if (product) {
        totalProducts++
        if (product.available) activeProducts++
      }
    }

    return Response.json({
      users: { total: userIds.length, customers, bakers, drivers },
      orders: { total: totalOrders, revenue: totalRevenue, pending: pendingOrders, completed: completedOrders },
      products: { total: totalProducts, active: activeProducts }
    })
  }

  if (action === 'users') {
    const usersStore = getStore({ name: USERS_STORE, consistency: 'strong' })
    const phoneIndex = (await usersStore.get('phone-index', { type: 'json' }) as Record<string, string> | null) || {}
    const userIds = Object.values(phoneIndex)
    const users: any[] = []
    for (const uid of userIds) {
      const user = await usersStore.get(`user-${uid}`, { type: 'json' }) as Record<string, any> | null
      if (user) {
        const { passwordHash, ...safeUser } = user
        users.push(safeUser)
      }
    }
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return Response.json({ users })
  }

  if (action === 'orders') {
    const ordersStore = getStore({ name: ORDERS_STORE, consistency: 'strong' })
    const { blobs } = await ordersStore.list()
    const orders: any[] = []
    for (const blob of blobs) {
      if (!blob.key.startsWith('order-')) continue
      const order = await ordersStore.get(blob.key, { type: 'json' }) as Record<string, any> | null
      if (order) orders.push(order)
    }
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return Response.json({ orders })
  }

  if (action === 'activity') {
    const usersStore = getStore({ name: USERS_STORE, consistency: 'strong' })
    const ordersStore = getStore({ name: ORDERS_STORE, consistency: 'strong' })

    const events: any[] = []

    // Recent users
    const phoneIndex = (await usersStore.get('phone-index', { type: 'json' }) as Record<string, string> | null) || {}
    for (const uid of Object.values(phoneIndex)) {
      const user = await usersStore.get(`user-${uid}`, { type: 'json' }) as Record<string, any> | null
      if (user) {
        events.push({
          type: 'user_registered',
          description: `${user.name} registered as ${user.role}`,
          area: user.area,
          timestamp: user.createdAt
        })
      }
    }

    // Recent orders
    const { blobs } = await ordersStore.list()
    for (const blob of blobs) {
      if (!blob.key.startsWith('order-')) continue
      const order = await ordersStore.get(blob.key, { type: 'json' }) as Record<string, any> | null
      if (order) {
        events.push({
          type: 'order_placed',
          description: `Order ${order.id} by ${order.customerName}`,
          amount: order.total,
          status: order.status,
          timestamp: order.createdAt
        })
        if (order.updatedAt && order.status !== 'pending') {
          events.push({
            type: 'order_updated',
            description: `Order ${order.id} status changed to ${order.status}`,
            timestamp: order.updatedAt
          })
        }
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return Response.json({ events: events.slice(0, 20) })
  }

  return Response.json({ error: 'Invalid action. Use: stats, users, orders, activity' }, { status: 400 })
}

export const config: Config = {
  path: '/api/admin',
}
