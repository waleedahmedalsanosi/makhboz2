import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { DeleteProductButton } from './DeleteProductButton'
import { ToggleAvailabilityButton } from './ToggleAvailabilityButton'

export default async function DashboardProductsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') redirect('/login')

  const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
  if (!baker) redirect('/login')

  const products = await prisma.product.findMany({
    where: { bakerId: baker.id },
    orderBy: { createdAt: 'desc' },
  })

  const categoryLabels: Record<string, string> = {
    KAAK: 'كعك',
    PETITFOUR: 'بيتي فور',
    BISCUIT: 'بسكويت',
    MANIN: 'معمول',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">منتجاتي</h1>
        <Link
          href="/dashboard/products/new"
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + إضافة منتج
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>لا توجد منتجات بعد</p>
          <Link href="/dashboard/products/new" className="text-amber-600 text-sm mt-2 block">
            أضف أول منتج
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-right px-4 py-3 font-medium">المنتج</th>
                <th className="text-right px-4 py-3 font-medium">الفئة</th>
                <th className="text-right px-4 py-3 font-medium">السعر</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {categoryLabels[product.category] ?? product.category}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <ToggleAvailabilityButton
                      productId={product.id}
                      isAvailable={product.isAvailable}
                    />
                  </td>
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                      >
                        تعديل
                      </Link>
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
