'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

type BakerInfo = {
  bankName: string | null
  bankAccount: string | null
  user: { name: string }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, bakerId, clearCart } = useCart()
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [baker, setBaker] = useState<BakerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0 && !orderId) {
      router.replace('/')
    }
  }, [items, orderId, router])

  useEffect(() => {
    if (!bakerId) return
    fetch(`/api/bakers/${bakerId}`)
      .then((r) => r.json())
      .then(setBaker)
      .catch(() => null)
  }, [bakerId])

  async function handleSubmit() {
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
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: address,
        paymentNote: note || undefined,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      setError(json.error ?? 'حدث خطأ')
      return
    }

    clearCart()
    setOrderId(json.id)
  }

  if (orderId) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-amber-100 p-8 max-w-md w-full space-y-4">
          <div className="text-center">
            <p className="text-4xl mb-3">🎉</p>
            <h1 className="text-xl font-bold text-gray-800 mb-1">تم إنشاء طلبك!</h1>
            <p className="text-sm text-gray-500">يرجى إتمام التحويل البنكي</p>
          </div>

          {baker?.bankName && baker?.bankAccount && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1 text-sm">
              <p className="font-semibold text-amber-800 mb-2">بيانات التحويل</p>
              <p className="text-gray-700">البنك: <span className="font-medium">{baker.bankName}</span></p>
              <p className="text-gray-700">رقم الحساب: <span className="font-medium">{baker.bankAccount}</span></p>
              <p className="text-gray-700">المبلغ: <span className="font-bold text-amber-700">{formatPrice(total)}</span></p>
            </div>
          )}

          <Link
            href={`/orders/${orderId}`}
            className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            رفع إثبات الدفع
          </Link>
          <Link
            href="/"
            className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-amber-700 hover:text-amber-900 text-sm"
          >
            ← رجوع
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">إتمام الطلب</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Order summary */}
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">ملخص الطلب</h2>
          {baker && (
            <p className="text-xs text-gray-500 mb-3">
              الخبازة: <span className="font-medium text-amber-700">{baker.user.name}</span>
            </p>
          )}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium text-gray-800">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>الإجمالي</span>
              <span className="text-amber-700">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Bank info */}
        {baker?.bankName && baker?.bankAccount && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="font-semibold text-amber-800 mb-2">بيانات التحويل البنكي</h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">البنك: <span className="font-medium">{baker.bankName}</span></p>
              <p className="text-gray-700">رقم الحساب: <span className="font-medium">{baker.bankAccount}</span></p>
              <p className="text-gray-700">المبلغ: <span className="font-bold text-amber-700">{formatPrice(total)}</span></p>
            </div>
          </div>
        )}

        {/* Delivery details */}
        <div className="bg-white rounded-xl border border-amber-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">تفاصيل التوصيل</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان التوصيل <span className="text-red-500">*</span>
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
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? 'جارٍ الإرسال...' : `تأكيد الطلب — ${formatPrice(total)}`}
          </button>
        </div>
      </main>
    </div>
  )
}
