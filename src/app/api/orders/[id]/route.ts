import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const buyerUpdateSchema = z.object({
  paymentProofUrl: z.string().url(),
})

const bakerUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'DELIVERED', 'CANCELLED'] as const).optional(),
  paymentStatus: z.enum(['VERIFIED', 'REJECTED'] as const).optional(),
})

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/orders/[id]'>
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  // Buyer submitting payment proof
  if (session.user.role === 'BUYER') {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const parsed = buyerUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentProofUrl: parsed.data.paymentProofUrl,
        paymentStatus: 'PROOF_SUBMITTED',
      },
    })
    return Response.json(updated)
  }

  // Baker updating order/payment status
  if (session.user.role === 'BAKER') {
    const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
    if (!baker) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const order = await prisma.order.findFirst({
      where: { id, items: { some: { product: { bakerId: baker.id } } } },
    })
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const parsed = bakerUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: parsed.data,
    })
    return Response.json(updated)
  }

  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}
