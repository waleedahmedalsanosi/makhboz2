'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    setLoading(true)
    await fetch(`/api/products/${productId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'حذف'}
    </button>
  )
}
