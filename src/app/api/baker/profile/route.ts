import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const profileSchema = z.object({
  bio: z.string().optional(),
  area: z.string().min(2, 'المنطقة يجب أن تكون حرفين على الأقل'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { imageUrl, ...rest } = parsed.data

  const baker = await prisma.baker.update({
    where: { userId: session.user.id },
    data: {
      ...rest,
      ...(imageUrl ? { imageUrl } : {}),
    },
  })

  return Response.json(baker)
}
