import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const buyerProofSchema = z.object({
  paymentProofUrl: z.string().url(),
})

const buyerCancelSchema = z.object({
  status: z.literal('CANCELLED'),
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

  // Buyer actions: submit payment proof or cancel
  if (session.user.role === 'BUYER') {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })

    // Cancel — only allowed when PENDING
    const cancelParsed = buyerCancelSchema.safeParse(body)
    if (cancelParsed.success) {
      if (order.status !== 'PENDING') {
        return Response.json({ error: 'لا يمكن إلغاء الطلب بعد قبوله' }, { status: 400 })
      }
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
      return Response.json(updated)
    }

    // Submit payment proof
    const proofParsed = buyerProofSchema.safeParse(body)
    if (!proofParsed.success) {
      return Response.json({ error: proofParsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentProofUrl: proofParsed.data.paymentProofUrl,
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
