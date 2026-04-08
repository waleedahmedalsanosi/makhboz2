'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERED' | 'CANCELLED'
type PaymentStatus = 'AWAITING_PROOF' | 'PROOF_SUBMITTED' | 'VERIFIED' | 'REJECTED'

export function OrderActions({
  orderId,
  currentStatus,
  paymentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
  paymentStatus: PaymentStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(data: object) {
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.refresh()
    setLoading(false)
  }

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: 'ACCEPTED',
    ACCEPTED: 'PREPARING',
    PREPARING: 'DELIVERED',
  }

  const statusLabels: Record<OrderStatus, string> = {
    PENDING: 'قبول الطلب',
    ACCEPTED: 'بدء التحضير',
    PREPARING: 'تسليم الطلب',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغي',
  }

  const next = nextStatus[currentStatus]

  return (
    <div className="flex gap-2 flex-wrap">
      {next && (
        <button
          onClick={() => update({ status: next })}
          disabled={loading}
          className="text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {statusLabels[currentStatus]}
        </button>
      )}

      {paymentStatus === 'PROOF_SUBMITTED' && (
        <>
          <button
            onClick={() => update({ paymentStatus: 'VERIFIED' })}
            disabled={loading}
            className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            تأكيد الدفع
          </button>
          <button
            onClick={() => update({ paymentStatus: 'REJECTED' })}
            disabled={loading}
            className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            رفض الدفع
          </button>
        </>
      )}

      {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
        <button
          onClick={() => update({ status: 'CANCELLED' })}
          disabled={loading}
          className="text-xs border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          إلغاء
        </button>
      )}
    </div>
  )
}
