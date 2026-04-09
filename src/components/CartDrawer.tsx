'use client'

import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

export function CartDrawer() {
  const { items, itemCount, total, removeItem, updateQty, clearCart, isOpen, closeCart } = useCart()
  const router = useRouter()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">
            السلة {itemCount > 0 && <span className="text-gray-400 font-normal text-sm">({itemCount})</span>}
          </h2>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-sm">السلة فارغة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Baker name */}
              <p className="text-xs text-gray-500 bg-amber-50 rounded-lg px-3 py-2">
                الخبازة: <span className="font-medium text-amber-800">{items[0]?.bakerName}</span>
              </p>

              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-start">
                  <div className="w-14 h-14 rounded-lg bg-amber-50 overflow-hidden shrink-0 flex items-center justify-center">
                    <Image
                      src={item.imageUrl || '/default-product.jpg'}
                      alt={item.productName}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">
                      {formatPrice(item.price)}/{item.unit}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-xs text-red-400 hover:text-red-600 mt-1 block"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between font-bold text-gray-800">
              <span>الإجمالي</span>
              <span className="text-amber-700">{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => {
                closeCart()
                router.push('/checkout')
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              إتمام الطلب
            </button>
            <button
              onClick={clearCart}
              className="w-full text-sm text-gray-400 hover:text-gray-600"
            >
              مسح السلة
            </button>
          </div>
        )}
      </div>
    </>
  )
}
