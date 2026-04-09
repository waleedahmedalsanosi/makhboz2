'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/utils'

export function AddToCartButton({
  productId,
  productName,
  bakerId,
  bakerName,
  price,
  unit,
  imageUrl,
}: {
  productId: string
  productName: string
  bakerId: string
  bakerName: string
  price: number
  unit: string
  imageUrl: string | null
}) {
  const { addItem, openCart, bakerId: cartBakerId } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [showWarning, setShowWarning] = useState(false)

  function handleAdd() {
    const { replaced } = addItem(
      { productId, productName, bakerId, bakerName, price, unit, imageUrl },
      quantity
    )
    if (replaced) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 4000)
    }
    openCart()
  }

  const differentBaker = cartBakerId && cartBakerId !== bakerId

  return (
    <div className="space-y-3">
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
        <span className="mr-auto font-bold text-amber-700">
          {formatPrice(price * quantity)}
        </span>
      </div>

      {differentBaker && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2">
          سلتك تحتوي على منتجات من خبازة أخرى. الإضافة ستمسح السلة الحالية.
        </div>
      )}

      {showWarning && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
          تم إنشاء سلة جديدة لهذه الخبازة.
        </div>
      )}

      <button
        onClick={handleAdd}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors"
      >
        أضف إلى السلة — {formatPrice(price * quantity)}
      </button>
    </div>
  )
}
