import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/validations'

async function getProductForBaker(productId: string, userId: string) {
  const baker = await prisma.baker.findUnique({ where: { userId } })
  if (!baker) return null
  return prisma.product.findFirst({
    where: { id: productId, bakerId: baker.id },
  })
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/products/[id]'>
) {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await ctx.params
  const product = await getProductForBaker(id, session.user.id)
  if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })

  const body = await request.json()
  const parsed = productSchema.partial().safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.product.update({
    where: { id },
    data: parsed.data,
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/products/[id]'>
) {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await ctx.params
  const product = await getProductForBaker(id, session.user.id)
  if (!product) return Response.json({ error: 'المنتج غير موجود' }, { status: 404 })

  await prisma.product.delete({ where: { id } })
  return Response.json({ message: 'تم الحذف' })
}
