'use client'

import { useState, useRef } from 'react'

export function ProductImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('purpose', 'product')

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    setUploading(false)

    if (!res.ok) {
      setError('فشل رفع الصورة')
      return
    }
    const json = await res.json()
    onChange(json.url)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="صورة المنتج" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 left-2 bg-white border border-gray-200 text-gray-600 hover:text-red-600 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg p-6 text-center text-sm text-gray-500 hover:text-amber-700 transition-colors disabled:opacity-60"
        >
          {uploading ? 'جارٍ الرفع...' : 'انقر لرفع صورة المنتج'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
