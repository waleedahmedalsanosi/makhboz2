import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req: Request) {
  if (req.method === 'GET') {
    const counts = await redis.get<Record<string, number>>('counters:counts')
    return Response.json(counts || { visitors: 0, customer: 0, baker: 0, driver: 0 })
  }

  if (req.method === 'POST') {
    const body = await req.json() as { type: string; role?: string }
    const counts = (await redis.get<Record<string, number>>('counters:counts')) ||
      { visitors: 0, customer: 0, baker: 0, driver: 0 }

    if (body.type === 'visit') {
      counts.visitors = (counts.visitors || 0) + 1
    } else if (body.type === 'register' && body.role) {
      const role = body.role
      if (role === 'customer' || role === 'baker' || role === 'driver') {
        counts[role] = (counts[role] || 0) + 1
      }
    }

    await redis.set('counters:counts', counts)
    return Response.json(counts)
  }

  return new Response('Method not allowed', { status: 405 })
}
