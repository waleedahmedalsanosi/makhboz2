import { put } from '@vercel/blob'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const tokenData = await redis.get<Record<string, string>>(`users:token-${token}`)
  if (!tokenData) return null
  return await redis.get<Record<string, any>>(`users:user-${tokenData.userId}`)
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const user = await getUser(req)
  if (!user || user.role !== 'baker') {
    return Response.json({ error: 'يجب تسجيل الدخول كصانعة' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return Response.json({ error: 'لم يتم إرسال صورة' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'حجم الصورة يتجاوز 5 ميجابايت' }, { status: 400 })
  }

  const ext = file.type.split('/')[1]
  const filename = `products/${user.id}-${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: 'public' })

  return Response.json({ url: blob.url })
}
