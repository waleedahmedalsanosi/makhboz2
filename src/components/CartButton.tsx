'use client'

import { useCart } from '@/context/CartContext'

export function CartButton() {
  const { itemCount, openCart } = useCart()

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="السلة"
    >
      <span className="text-xl leading-none">🛒</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -left-2 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  )
}

<style jsx>{`
  @media (max-width: 768px) {
    .cart-button {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 50;
    }
  }
`}</style>
