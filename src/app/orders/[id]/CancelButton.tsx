'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-sm border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
    >
      {loading ? '...' : 'إلغاء الطلب'}
    </button>
  )
}
