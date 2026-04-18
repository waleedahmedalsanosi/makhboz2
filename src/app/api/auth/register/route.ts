import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, email, password, phone, role, area } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json(
      { error: 'البريد الإلكتروني مستخدم بالفعل' },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    },
  })

  if (role === 'BAKER') {
    await prisma.baker.create({
      data: {
        userId: user.id,
        area: area!,
      },
    })
  }

  return Response.json(
    { message: 'تم إنشاء الحساب بنجاح' },
    { status: 201 }
  )
}
