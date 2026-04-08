import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبول',
  PREPARING: 'جارٍ التحضير',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const paymentLabels: Record<string, string> = {
  AWAITING_PROOF: 'ينتظر إثبات الدفع',
  PROOF_SUBMITTED: 'إثبات مُرسل',
  VERIFIED: 'تم التحقق',
  REJECTED: 'مرفوض',
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-amber-800">مخبوز</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">طلباتي</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">طلباتي</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>لا توجد طلبات بعد</p>
            <Link href="/" className="text-amber-600 text-sm mt-2 block">
              تسوق الآن
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-amber-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {order.items.map((i) => i.product.name).join('، ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-amber-700">{formatPrice(order.total)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[order.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
                {order.paymentStatus === 'AWAITING_PROOF' && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    يرجى رفع إثبات الدفع
                  </div>
                )}
                {order.paymentStatus !== 'VERIFIED' && order.paymentStatus !== 'AWAITING_PROOF' && (
                  <p className="text-xs text-gray-500 mt-2">
                    الدفع: {paymentLabels[order.paymentStatus]}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
