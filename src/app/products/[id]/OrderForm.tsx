'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

export function OrderForm({
  productId,
  productName,
  price,
  unit,
  bakerBankName,
  bakerBankAccount,
}: {
  productId: string
  productName: string
  price: number
  unit: string
  bakerBankName: string | null
  bakerBankAccount: string | null
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const total = price * quantity

  async function handleOrder() {
    if (!address.trim()) {
      setError('يرجى إدخال عنوان التوصيل')
      return
    }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId, quantity }],
        deliveryAddress: address,
        paymentNote: note || undefined,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error)
      return
    }

    setOrderId(json.id)
  }

  if (orderId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
        <p className="font-semibold text-green-800">تم إنشاء طلبك بنجاح!</p>

        {bakerBankName && bakerBankAccount && (
          <div className="bg-white border border-green-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-gray-800 mb-2">بيانات التحويل البنكي:</p>
            <p className="text-gray-600">البنك: <span className="font-medium">{bakerBankName}</span></p>
            <p className="text-gray-600">رقم الحساب: <span className="font-medium">{bakerBankAccount}</span></p>
            <p className="text-gray-600">المبلغ: <span className="font-bold text-amber-700">{formatPrice(total)}</span></p>
          </div>
        )}

        <p className="text-sm text-gray-600">
          بعد التحويل، أرسل إثبات الدفع من صفحة{' '}
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="text-amber-600 hover:underline font-medium"
          >
            تفاصيل الطلب
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">الكمية:</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            −
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>
        <span className="text-sm text-gray-500">{unit}</span>
        <span className="mr-auto font-bold text-amber-700">{formatPrice(total)}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          عنوان التوصيل
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="الحي، الشارع، رقم المنزل..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ملاحظة (اختياري)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          rows={2}
          placeholder="أي طلبات خاصة..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? 'جارٍ الإرسال...' : `اطلب الآن — ${formatPrice(total)}`}
      </button>
    </div>
  )
}
