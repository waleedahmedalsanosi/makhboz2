export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { EditProductForm } from './EditProductForm'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') redirect('/login')

  const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
  if (!baker) redirect('/login')

  const product = await prisma.product.findFirst({
    where: { id, bakerId: baker.id },
  })
  if (!product) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-800 mb-6">تعديل المنتج</h1>
      <EditProductForm product={product} />
    </div>
  )
}
