import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'marketplace-users'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function generateToken(userId: string): string {
  return userId + '.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 10)
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const body = await req.json() as Record<string, string>
  const { action } = body

  if (action === 'register') {
    const { name, phone, password, area, role } = body
    if (!name || !phone || !password || !area || !role) {
      return Response.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (!['customer', 'baker', 'driver'].includes(role)) {
      return Response.json({ error: 'نوع حساب غير صحيح' }, { status: 400 })
    }
    if (password.length < 4) {
      return Response.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 })
    }

    // Check if phone already registered
    const existingIndex = await store.get('phone-index', { type: 'json' }) as Record<string, string> | null || {}
    if (existingIndex[phone]) {
      return Response.json({ error: 'رقم الهاتف مسجل مسبقاً. الرجاء تسجيل الدخول' }, { status: 409 })
    }

    const userId = generateId()
    const user = {
      id: userId,
      name,
      phone,
      passwordHash: simpleHash(password),
      area,
      role,
      products: body.products || '',
      createdAt: new Date().toISOString()
    }

    await store.setJSON(`user-${userId}`, user)
    existingIndex[phone] = userId
    await store.setJSON('phone-index', existingIndex)

    const token = generateToken(userId)
    await store.setJSON(`token-${token}`, { userId, createdAt: new Date().toISOString() })

    const { passwordHash, ...safeUser } = user
    return Response.json({ user: safeUser, token })
  }

  if (action === 'login') {
    const { phone, password } = body
    if (!phone || !password) {
      return Response.json({ error: 'الرجاء إدخال رقم الهاتف وكلمة المرور' }, { status: 400 })
    }

    const phoneIndex = await store.get('phone-index', { type: 'json' }) as Record<string, string> | null || {}
    const userId = phoneIndex[phone]
    if (!userId) {
      return Response.json({ error: 'رقم الهاتف غير مسجل' }, { status: 401 })
    }

    const user = await store.get(`user-${userId}`, { type: 'json' }) as Record<string, any> | null
    if (!user || user.passwordHash !== simpleHash(password)) {
      return Response.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const token = generateToken(userId)
    await store.setJSON(`token-${token}`, { userId, createdAt: new Date().toISOString() })

    const { passwordHash, ...safeUser } = user
    return Response.json({ user: safeUser, token })
  }

  if (action === 'verify') {
    const token = body.token
    if (!token) return Response.json({ valid: false })
    const tokenData = await store.get(`token-${token}`, { type: 'json' }) as Record<string, string> | null
    if (!tokenData) return Response.json({ valid: false })
    const user = await store.get(`user-${tokenData.userId}`, { type: 'json' }) as Record<string, any> | null
    if (!user) return Response.json({ valid: false })
    const { passwordHash, ...safeUser } = user
    return Response.json({ valid: true, user: safeUser })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

export const config: Config = {
  path: '/api/auth',
}
