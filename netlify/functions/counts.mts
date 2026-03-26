import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'site-counters'

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' })

  if (req.method === 'GET') {
    const counts = await store.get('counts', { type: 'json' }) as Record<string, number> | null
    const data = counts || { visitors: 0, customer: 0, baker: 0, driver: 0 }
    return Response.json(data)
  }

  if (req.method === 'POST') {
    const body = await req.json() as { type: string; role?: string }
    const counts = (await store.get('counts', { type: 'json' }) as Record<string, number> | null) ||
      { visitors: 0, customer: 0, baker: 0, driver: 0 }

    if (body.type === 'visit') {
      counts.visitors = (counts.visitors || 0) + 1
    } else if (body.type === 'register' && body.role) {
      const role = body.role
      if (role === 'customer' || role === 'baker' || role === 'driver') {
        counts[role] = (counts[role] || 0) + 1
      }
    }

    await store.setJSON('counts', counts)
    return Response.json(counts)
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/counts',
}
