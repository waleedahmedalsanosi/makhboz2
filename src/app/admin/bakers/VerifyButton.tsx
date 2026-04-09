'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function VerifyButton({
  bakerId,
  isVerified,
}: {
  bakerId: string
  isVerified: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/admin/bakers/${bakerId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: !isVerified }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-60 ${
        isVerified
          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
          : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
      }`}
    >
      {loading ? '...' : isVerified ? '✓ موثق' : 'توثيق'}
    </button>
  )
}
