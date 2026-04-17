export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { PaymentProofUpload } from './PaymentProofUpload'
import { ReviewForm } from './ReviewForm'
import { CancelButton } from './CancelButton'

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبول',
  PREPARING: 'جارٍ التحضير',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
}

const paymentLabels: Record<string, string> = {
  AWAITING_PROOF: 'ينتظر إثبات الدفع',
  PROOF_SUBMITTED: 'إثبات مُرسل — بانتظار التحقق',
  VERIFIED: 'تم التحقق من الدفع',
  REJECTED: 'تم رفض الإثبات',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { baker: { include: { user: { select: { name: true } } } } },
          },
        },
      },
      review: true,
    },
  })

  if (!order) notFound()

  const baker = order.items[0]?.product.baker

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/orders" className="text-amber-700 hover:text-amber-900 text-sm">
            ← طلباتي
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">تفاصيل الطلب</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Status */}
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">حالة الطلب</p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {statusLabels[order.status] ?? order.status}
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500">حالة الدفع</p>
              <p
                className={`text-sm font-medium mt-0.5 ${
                  order.paymentStatus === 'VERIFIED'
                    ? 'text-green-600'
                    : order.paymentStatus === 'REJECTED'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">المنتجات</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-800">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>الإجمالي</span>
              <span className="text-amber-700">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-2">التوصيل</h2>
          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          {baker && (
            <p className="text-sm text-gray-500 mt-1">
              الخبازة: {baker.user.name}
            </p>
          )}
        </div>

        {/* Bank transfer info */}
        {order.paymentStatus === 'AWAITING_PROOF' && baker?.bankName && baker?.bankAccount && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="font-semibold text-amber-800 mb-3">بيانات التحويل البنكي</h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">البنك: <span className="font-medium">{baker.bankName}</span></p>
              <p className="text-gray-700">رقم الحساب: <span className="font-medium">{baker.bankAccount}</span></p>
              <p className="text-gray-700">المبلغ: <span className="font-bold text-amber-700">{formatPrice(order.total)}</span></p>
            </div>
          </div>
        )}

        {/* Payment proof upload */}
        {order.paymentStatus === 'AWAITING_PROOF' || order.paymentStatus === 'REJECTED' ? (
          <PaymentProofUpload orderId={order.id} />
        ) : order.paymentProofUrl ? (
          <div className="bg-white rounded-xl border border-amber-100 p-5">
            <h2 className="font-semibold text-gray-700 mb-2">إثبات الدفع</h2>
            <a
              href={order.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-amber-600 hover:underline"
            >
              عرض الإثبات المُرسل
            </a>
          </div>
        ) : null}

        {/* Cancel order */}
        {order.status === 'PENDING' && (
          <div className="flex justify-end">
            <CancelButton orderId={order.id} />
          </div>
        )}

        {/* Review form */}
        {order.status === 'DELIVERED' && (
          <ReviewForm
            orderId={order.id}
            existingRating={order.review?.rating}
          />
        )}
      </main>
    </div>
  )
}
