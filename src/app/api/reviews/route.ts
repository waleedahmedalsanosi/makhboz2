import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const reviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await request.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { orderId, rating, comment } = parsed.data

  // Verify the order belongs to this buyer and is delivered
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, status: 'DELIVERED' },
  })
  if (!order) {
    return Response.json({ error: 'لا يمكن تقييم هذا الطلب' }, { status: 403 })
  }

  // Upsert — allow updating existing review
  const review = await prisma.review.upsert({
    where: { orderId },
    create: { orderId, rating, comment },
    update: { rating, comment },
  })

  // Update baker's average rating
  const baker = await prisma.baker.findFirst({
    where: { products: { some: { orderItems: { some: { orderId } } } } },
    select: { id: true },
  })
  if (baker) {
    const reviews = await prisma.review.findMany({
      where: { order: { items: { some: { product: { bakerId: baker.id } } } } },
      select: { rating: true },
    })
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    await prisma.baker.update({
      where: { id: baker.id },
      data: { rating: Math.round(avg * 10) / 10 },
    })
  }

  return Response.json(review, { status: 201 })
}
