import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { orderSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { items, deliveryAddress, paymentNote } = parsed.data

  // Fetch all products server-side to calculate total — never trust client
  const productIds = items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isAvailable: true },
  })

  if (products.length !== productIds.length) {
    return Response.json({ error: 'بعض المنتجات غير متاحة' }, { status: 400 })
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!
    return sum + product.price * item.quantity
  }, 0)

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      deliveryAddress,
      paymentNote,
      total,
      items: {
        create: items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          }
        }),
      },
    },
    include: { items: true },
  })

  return Response.json(order, { status: 201 })
}
