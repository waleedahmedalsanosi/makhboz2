import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const baker = await prisma.baker.findUnique({
    where: { userId: session.user.id },
  })
  if (!baker) {
    return Response.json({ error: 'لم يتم العثور على حساب الخباز' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      bakerId: baker.id,
    },
  })

  return Response.json(product, { status: 201 })
}
