import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

const STORE_NAME = 'site-analytics'

interface PageView {
  path: string
  timestamp: string
  referrer: string
  userAgent: string
}

interface DailyStats {
  date: string
  views: number
  uniquePaths: Record<string, number>
  referrers: Record<string, number>
  hourly: number[]
}

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const url = new URL(req.url)

  if (req.method === 'POST') {
    const body = await req.json() as { path: string; referrer?: string }
    const now = new Date()
    const dateKey = now.toISOString().slice(0, 10)
    const hour = now.getUTCHours()

    const daily = (await store.get(`daily:${dateKey}`, { type: 'json' }) as DailyStats | null) || {
      date: dateKey,
      views: 0,
      uniquePaths: {},
      referrers: {},
      hourly: new Array(24).fill(0),
    }

    daily.views += 1
    daily.uniquePaths[body.path || '/'] = (daily.uniquePaths[body.path || '/'] || 0) + 1
    if (body.referrer) {
      daily.referrers[body.referrer] = (daily.referrers[body.referrer] || 0) + 1
    }
    daily.hourly[hour] = (daily.hourly[hour] || 0) + 1

    await store.setJSON(`daily:${dateKey}`, daily)

    // Track total all-time views
    const totals = (await store.get('totals', { type: 'json' }) as Record<string, number> | null) || { allTimeViews: 0 }
    totals.allTimeViews += 1
    await store.setJSON('totals', totals)

    return Response.json({ ok: true })
  }

  if (req.method === 'GET') {
    const range = url.searchParams.get('range') || '7'
    const days = Math.min(parseInt(range, 10) || 7, 30)
    const now = new Date()
    const results: DailyStats[] = []

    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() - i)
      const dateKey = d.toISOString().slice(0, 10)
      const daily = await store.get(`daily:${dateKey}`, { type: 'json' }) as DailyStats | null
      if (daily) {
        results.push(daily)
      } else {
        results.push({ date: dateKey, views: 0, uniquePaths: {}, referrers: {}, hourly: new Array(24).fill(0) })
      }
    }

    const totals = (await store.get('totals', { type: 'json' }) as Record<string, number> | null) || { allTimeViews: 0 }

    return Response.json({ days: results.reverse(), totals })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/analytics',
}
