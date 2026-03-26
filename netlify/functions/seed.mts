import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'marketplace-products'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = { kaak: '🍪', petitfour: '🧁', biscuit: '🍘', manin: '🥮' }
  return map[cat] || '🍪'
}

const sampleProducts = [
  { name: 'كعك سوداني بالتمر', category: 'kaak', description: 'كعك تقليدي محشو بعجوة التمر — بوصفة أصلية متوارثة. مناسب للعيد والمناسبات.', price: 5000, unit: 'kg', minOrder: 1, occasions: ['عيد الفطر', 'عيد الأضحى', 'ضيافة'], bakerName: 'أم محمد', area: 'omdurman' },
  { name: 'كعك بالفول السوداني', category: 'kaak', description: 'كعك مقرمش بالفول السوداني المحمص — طعم مميز ورائحة تفتح النفس.', price: 4500, unit: 'kg', minOrder: 1, occasions: ['عيد الفطر', 'ضيافة'], bakerName: 'أم أحمد', area: 'bahri' },
  { name: 'بيتفور مشكل فاخر', category: 'petitfour', description: 'تشكيلة بيتفور متنوعة — بالمكسرات والشوكولاتة والسمسم. تغليف أنيق للهدايا.', price: 7000, unit: 'kg', minOrder: 1, occasions: ['أعراس', 'هدايا', 'ضيافة'], bakerName: 'أم خالد', area: 'khartoum' },
  { name: 'بيتفور بالجبنة', category: 'petitfour', description: 'بيتفور مالح بجبنة كريمية — مثالي للضيافة مع الشاي.', price: 6000, unit: 'kg', minOrder: 1, occasions: ['ضيافة', 'سماية'], bakerName: 'أم محمد', area: 'omdurman' },
  { name: 'بسكويت بالسمسم', category: 'biscuit', description: 'بسكويت مقرمش بالسمسم والسمن البلدي — طعم البيت الأصيل.', price: 3500, unit: 'kg', minOrder: 1, occasions: ['ضيافة'], bakerName: 'أم عمر', area: 'khartoum-north' },
  { name: 'بسكويت النشادر', category: 'biscuit', description: 'بسكويت النشادر السوداني الكلاسيكي — خفيف ومقرمش مع الشاي.', price: 3000, unit: 'kg', minOrder: 1, occasions: ['ضيافة', 'عيد الفطر'], bakerName: 'أم أحمد', area: 'bahri' },
  { name: 'منين بالسمن', category: 'manin', description: 'منين بالسمن البلدي — مخبوز على نار هادية بالوصفة التقليدية.', price: 5500, unit: 'kg', minOrder: 1, occasions: ['المولد النبوي', 'سماية', 'ضيافة'], bakerName: 'أم خالد', area: 'khartoum' },
  { name: 'منين بالتمر والسمسم', category: 'manin', description: 'منين محشو بالتمر ومرشوش بالسمسم — مذاق فريد ومميز.', price: 6000, unit: 'kg', minOrder: 1, occasions: ['المولد النبوي', 'أعراس', 'هدايا'], bakerName: 'أم عمر', area: 'khartoum-north' },
  { name: 'كعك العروسة', category: 'kaak', description: 'كعك مزين خاص بالأعراس — كبير الحجم ومزخرف بالمكسرات. يتم الطلب قبل أسبوع.', price: 8000, unit: 'piece', minOrder: 2, occasions: ['أعراس'], bakerName: 'أم خالد', area: 'khartoum' },
  { name: 'تشكيلة العيد الكاملة', category: 'petitfour', description: 'صندوق مشكل يحتوي كعك وبيتفور وبسكويت — جاهز للعيد. تغليف هدايا فاخر.', price: 12000, unit: 'box', minOrder: 1, occasions: ['عيد الفطر', 'عيد الأضحى', 'هدايا'], bakerName: 'أم محمد', area: 'omdurman' },
  { name: 'بسكويت الشاي بالقرفة', category: 'biscuit', description: 'بسكويت معطر بالقرفة والحبهان — مثالي مع كوب شاي ساخن.', price: 3200, unit: 'kg', minOrder: 1, occasions: ['ضيافة'], bakerName: 'أم محمد', area: 'omdurman' },
  { name: 'بيتفور بالتمر والمكسرات', category: 'petitfour', description: 'بيتفور فاخر محشو بعجوة التمر ومزين بالمكسرات — أناقة ومذاق.', price: 8000, unit: 'kg', minOrder: 1, occasions: ['أعراس', 'هدايا', 'المولد النبوي'], bakerName: 'أم عمر', area: 'khartoum-north' },
]

// Maps baker names to consistent IDs
const bakerMap: Record<string, string> = {}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })

  // Check if already seeded
  const existingIndex = await store.get('products-index', { type: 'json' }) as string[] | null
  if (existingIndex && existingIndex.length > 0) {
    return Response.json({ message: 'البيانات موجودة مسبقاً', count: existingIndex.length })
  }

  const productIds: string[] = []

  for (const sample of sampleProducts) {
    // Generate consistent baker IDs
    if (!bakerMap[sample.bakerName]) {
      bakerMap[sample.bakerName] = 'baker-' + generateId()
    }

    const productId = generateId()
    const product = {
      id: productId,
      bakerId: bakerMap[sample.bakerName],
      bakerName: sample.bakerName,
      bakerArea: sample.area,
      name: sample.name,
      category: sample.category,
      description: sample.description,
      price: sample.price,
      unit: sample.unit,
      minOrder: sample.minOrder,
      available: true,
      occasions: sample.occasions,
      area: sample.area,
      emoji: getCategoryEmoji(sample.category),
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
    }

    await store.setJSON(`product-${productId}`, product)
    productIds.push(productId)
  }

  await store.setJSON('products-index', productIds)

  return Response.json({ message: 'تم إضافة المنتجات بنجاح', count: productIds.length })
}

export const config: Config = {
  path: '/api/seed',
}
