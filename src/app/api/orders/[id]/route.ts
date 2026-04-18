import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const CLOUDINARY_BASE = 'https://res.cloudinary.com/'

const buyerProofSchema = z.object({
  paymentProofUrl: z.string().url().refine(
    (url) => url.startsWith(CLOUDINARY_BASE),
    { message: 'رابط إثبات الدفع غير صحيح' }
  ),
})

const buyerCancelSchema = z.object({
  status: z.literal('CANCELLED'),
})

const bakerUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'DELIVERED'] as const).optional(),
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
    // Cancel — only allowed when PENDING
    const cancelParsed = buyerCancelSchema.safeParse(body)
    if (cancelParsed.success) {
      const result = await prisma.order.updateMany({
        where: { id, userId: session.user.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
      if (result.count === 0)
        return Response.json({ error: 'الطلب غير موجود أو لا يمكن إلغاؤه' }, { status: 404 })
      return Response.json({ id, status: 'CANCELLED' })
    }

    // Submit payment proof
    const proofParsed = buyerProofSchema.safeParse(body)
    if (!proofParsed.success) {
      return Response.json({ error: proofParsed.error.issues[0].message }, { status: 400 })
    }

    const result = await prisma.order.updateMany({
      where: { id, userId: session.user.id },
      data: {
        paymentProofUrl: proofParsed.data.paymentProofUrl,
        paymentStatus: 'PROOF_SUBMITTED',
      },
    })
    if (result.count === 0)
      return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return Response.json({ id, paymentStatus: 'PROOF_SUBMITTED', paymentProofUrl: proofParsed.data.paymentProofUrl })
  }

  // Baker updating order/payment status
  if (session.user.role === 'BAKER') {
    const parsed = bakerUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
    if (!baker) return Response.json({ error: 'غير مصرح' }, { status: 401 })

    const result = await prisma.order.updateMany({
      where: { id, items: { some: { product: { bakerId: baker.id } } } },
      data: parsed.data,
    })
    if (result.count === 0)
      return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return Response.json({ id, ...parsed.data })
  }

  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}
