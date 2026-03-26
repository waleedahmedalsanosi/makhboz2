import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'marketplace-products'
const USERS_STORE = 'marketplace-users'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null

  const usersStore = getStore({ name: USERS_STORE, consistency: 'strong' })
  const tokenData = await usersStore.get(`token-${token}`, { type: 'json' }) as Record<string, string> | null
  if (!tokenData) return null

  const user = await usersStore.get(`user-${tokenData.userId}`, { type: 'json' }) as Record<string, any> | null
  return user
}

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const id = url.searchParams.get('id')

    // Single product
    if (id) {
      const product = await store.get(`product-${id}`, { type: 'json' })
      if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
      return Response.json(product)
    }

    // List products with filters
    const category = url.searchParams.get('category') || ''
    const area = url.searchParams.get('area') || ''
    const search = url.searchParams.get('search') || ''
    const bakerId = url.searchParams.get('bakerId') || ''

    const indexData = await store.get('products-index', { type: 'json' }) as string[] | null
    const productIds = indexData || []

    const products: any[] = []
    for (const pid of productIds) {
      const p = await store.get(`product-${pid}`, { type: 'json' }) as Record<string, any> | null
      if (!p || !p.available) continue
      if (category && p.category !== category) continue
      if (area && p.area !== area) continue
      if (bakerId && p.bakerId !== bakerId) continue
      if (search && !p.name.includes(search) && !p.description.includes(search) && !p.bakerName.includes(search)) continue
      products.push(p)
    }

    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return Response.json({ products })
  }

  if (req.method === 'POST') {
    const user = await getUser(req)
    if (!user || user.role !== 'baker') {
      return Response.json({ error: 'يجب تسجيل الدخول كصانعة' }, { status: 401 })
    }

    const body = await req.json() as Record<string, any>
    const { name, category, description, price, unit, minOrder } = body

    if (!name || !category || !price) {
      return Response.json({ error: 'الاسم والفئة والسعر مطلوبة' }, { status: 400 })
    }

    const productId = generateId()
    const product = {
      id: productId,
      bakerId: user.id,
      bakerName: user.name,
      bakerArea: user.area,
      name,
      category,
      description: description || '',
      price: Number(price),
      unit: unit || 'kg',
      minOrder: Number(minOrder) || 1,
      available: true,
      occasions: body.occasions || [],
      area: user.area,
      emoji: getCategoryEmoji(category),
      createdAt: new Date().toISOString()
    }

    await store.setJSON(`product-${productId}`, product)

    // Update index
    const index = (await store.get('products-index', { type: 'json' }) as string[] | null) || []
    index.push(productId)
    await store.setJSON('products-index', index)

    return Response.json(product)
  }

  if (req.method === 'PUT') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const body = await req.json() as Record<string, any>
    const { id } = body
    if (!id) return Response.json({ error: 'معرف المنتج مطلوب' }, { status: 400 })

    const product = await store.get(`product-${id}`, { type: 'json' }) as Record<string, any> | null
    if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
    if (product.bakerId !== user.id) return Response.json({ error: 'غير مصرح بتعديل هذا المنتج' }, { status: 403 })

    const updated = { ...product, ...body, id: product.id, bakerId: product.bakerId, bakerName: product.bakerName, emoji: getCategoryEmoji(body.category || product.category) }
    if (body.price) updated.price = Number(body.price)
    if (body.minOrder) updated.minOrder = Number(body.minOrder)

    await store.setJSON(`product-${id}`, updated)
    return Response.json(updated)
  }

  if (req.method === 'DELETE') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const id = url.searchParams.get('id')
    if (!id) return Response.json({ error: 'معرف المنتج مطلوب' }, { status: 400 })

    const product = await store.get(`product-${id}`, { type: 'json' }) as Record<string, any> | null
    if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
    if (product.bakerId !== user.id) return Response.json({ error: 'غير مصرح' }, { status: 403 })

    // Soft delete - mark unavailable
    product.available = false
    await store.setJSON(`product-${id}`, product)

    return Response.json({ success: true })
  }

  return new Response('Method not allowed', { status: 405 })
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = { kaak: '🍪', petitfour: '🧁', biscuit: '🍘', manin: '🥮' }
  return map[cat] || '🍪'
}

export const config: Config = {
  path: '/api/products',
}
