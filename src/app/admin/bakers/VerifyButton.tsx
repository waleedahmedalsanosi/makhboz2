'use client'

import { useState } from 'react'

export function VerifyButton({
  bakerId,
  isVerified,
}: {
  bakerId: string
  isVerified: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [localVerified, setLocalVerified] = useState(isVerified)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/admin/bakers/${bakerId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified: !localVerified }),
    })
    setLoading(false)
    if (res.ok) setLocalVerified((v) => !v)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-60 ${
        localVerified
          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
          : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
      }`}
    >
      {loading ? '...' : localVerified ? '✓ موثق' : 'توثيق'}
    </button>
  )
}
