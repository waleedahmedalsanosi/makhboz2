import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
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
    const id = url.searchParams.get('id')

    if (id) {
      const product = await redis.get(`products:product-${id}`)
      if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
      return Response.json(product)
    }

    const category = url.searchParams.get('category') || ''
    const area = url.searchParams.get('area') || ''
    const search = url.searchParams.get('search') || ''
    const bakerId = url.searchParams.get('bakerId') || ''

    const productIds = (await redis.get<string[]>('products:products-index')) || []

    const products: any[] = []
    for (const pid of productIds) {
      const p = await redis.get<Record<string, any>>(`products:product-${pid}`)
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

    await redis.set(`products:product-${productId}`, product)

    const index = (await redis.get<string[]>('products:products-index')) || []
    index.push(productId)
    await redis.set('products:products-index', index)

    return Response.json(product)
  }

  if (req.method === 'PUT') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const body = await req.json() as Record<string, any>
    const { id } = body
    if (!id) return Response.json({ error: 'معرف المنتج مطلوب' }, { status: 400 })

    const product = await redis.get<Record<string, any>>(`products:product-${id}`)
    if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
    if (product.bakerId !== user.id) return Response.json({ error: 'غير مصرح بتعديل هذا المنتج' }, { status: 403 })

    const updated = { ...product, ...body, id: product.id, bakerId: product.bakerId, bakerName: product.bakerName, emoji: getCategoryEmoji(body.category || product.category) }
    if (body.price) updated.price = Number(body.price)
    if (body.minOrder) updated.minOrder = Number(body.minOrder)

    await redis.set(`products:product-${id}`, updated)
    return Response.json(updated)
  }

  if (req.method === 'DELETE') {
    const user = await getUser(req)
    if (!user) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const id = url.searchParams.get('id')
    if (!id) return Response.json({ error: 'معرف المنتج مطلوب' }, { status: 400 })

    const product = await redis.get<Record<string, any>>(`products:product-${id}`)
    if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })
    if (product.bakerId !== user.id) return Response.json({ error: 'غير مصرح' }, { status: 403 })

    product.available = false
    await redis.set(`products:product-${id}`, product)

    return Response.json({ success: true })
  }

  return new Response('Method not allowed', { status: 405 })
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = { kaak: '🍪', petitfour: '🧁', biscuit: '🍘', manin: '🥮' }
  return map[cat] || '🍪'
}
