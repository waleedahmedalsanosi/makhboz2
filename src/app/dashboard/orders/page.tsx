export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { OrderActions } from './OrderActions'
import { SkeletonOrderList } from '@/components/Skeleton';

export default async function DashboardOrdersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') redirect('/login')

  const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
  if (!baker) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { bakerId: baker.id } } } },
    include: {
      user: { select: { name: true, phone: true } },
      items: {
        include: { product: { select: { name: true, price: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const paymentLabels: Record<string, string> = {
    AWAITING_PROOF: 'ينتظر الإثبات',
    PROOF_SUBMITTED: 'إثبات مُرسل',
    VERIFIED: 'تم التحقق',
    REJECTED: 'مرفوض',
  }

  const paymentColors: Record<string, string> = {
    AWAITING_PROOF: 'bg-gray-100 text-gray-600',
    PROOF_SUBMITTED: 'bg-yellow-100 text-yellow-700',
    VERIFIED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">الطلبات الواردة</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>لا توجد طلبات بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{order.user.name}</p>
                  {order.user.phone && (
                    <p className="text-xs text-gray-500">{order.user.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{order.deliveryAddress}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-amber-700">{formatPrice(order.total)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      paymentColors[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.product.name} × {item.quantity} —{' '}
                    {formatPrice(item.price * item.quantity)}
                  </p>
                ))}
              </div>

              {order.paymentProofUrl && (
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:underline block mb-3"
                >
                  عرض إثبات الدفع
                </a>
              )}

              <OrderActions
                orderId={order.id}
                currentStatus={order.status}
                paymentStatus={order.paymentStatus}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
