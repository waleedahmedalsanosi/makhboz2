import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/bakers/[id]'>
) {
  const { id } = await ctx.params
  const baker = await prisma.baker.findUnique({
    where: { id },
    select: {
      bankName: true,
      bankAccount: true,
      area: true,
      user: { select: { name: true } },
    },
  })
  if (!baker) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(baker)
}
