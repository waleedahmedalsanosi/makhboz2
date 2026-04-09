import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const baker = await prisma.baker.findUnique({
    where: { userId: session.user.id },
  })

  return Response.json(baker)
}
