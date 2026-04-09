'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReviewForm({
  orderId,
  existingRating,
}: {
  orderId: string
  existingRating?: number
}) {
  const router = useRouter()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!!existingRating)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <div className="bg-white rounded-xl border border-amber-100 p-5">
        <p className="text-sm text-gray-600">
          قيّمت هذا الطلب{' '}
          {'★'.repeat(existingRating ?? rating)}{'☆'.repeat(5 - (existingRating ?? rating))}
        </p>
      </div>
    )
  }

  async function handleSubmit() {
    if (!rating) {
      setError('يرجى اختيار تقييم')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rating, comment: comment || undefined }),
    })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error)
      return
    }
    setDone(true)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-5">
      <h2 className="font-semibold text-gray-700 mb-3">قيّم طلبك</h2>

      {/* Star rating */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110"
          >
            <span className={star <= (hovered || rating) ? 'text-amber-500' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-3"
        placeholder="شاركي رأيك (اختياري)..."
      />

      {error && (
        <p className="text-red-500 text-xs mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !rating}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
      </button>
    </div>
  )
}
