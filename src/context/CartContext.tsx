'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type CartItem = {
  productId: string
  productName: string
  bakerId: string
  bakerName: string
  price: number
  unit: string
  imageUrl: string | null
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => { replaced: boolean }
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  itemCount: number
  total: number
  bakerId: string | null
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('makhboz_cart')
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('makhboz_cart', JSON.stringify(items))
  }, [items])

  function addItem(item: Omit<CartItem, 'quantity'>, qty = 1): { replaced: boolean } {
    const replaced = items.length > 0 && items[0].bakerId !== item.bakerId
    setItems((prev) => {
      if (prev.length > 0 && prev[0].bakerId !== item.bakerId) {
        alert('لا يمكن إضافة منتجات من خبازين مختلفين إلى السلة.');
        return prev
      }
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, { ...item, quantity: qty }]
    })
    return { replaced }
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    )
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const bakerId = items[0]?.bakerId ?? null

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        itemCount,
        total,
        bakerId,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
