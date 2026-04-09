import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({ isVerified: z.boolean() })

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/admin/bakers/[id]/verify'>
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { id } = await ctx.params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
  }

  const baker = await prisma.baker.findUnique({ where: { id } })
  if (!baker) return Response.json({ error: 'الخبازة غير موجودة' }, { status: 404 })

  await prisma.baker.update({
    where: { id },
    data: { isVerified: parsed.data.isVerified },
  })

  return Response.json({ ok: true })
}
