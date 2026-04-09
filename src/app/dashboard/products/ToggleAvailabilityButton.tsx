'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ToggleAvailabilityButton({
  productId,
  isAvailable,
}: {
  productId: string
  isAvailable: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-60 ${
        isAvailable
          ? 'bg-green-100 text-green-700 hover:bg-gray-100 hover:text-gray-500'
          : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
      }`}
    >
      {loading ? '...' : isAvailable ? 'متاح' : 'غير متاح'}
    </button>
  )
}
