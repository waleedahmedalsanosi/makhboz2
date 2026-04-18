'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

export function PaymentProofUpload({ orderId }: { orderId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit() {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('يرجى اختيار صورة')
      return
    }

    setUploading(true)
    setError(null)

    // Upload to Cloudinary
    const formData = new FormData()
    formData.append('file', file)
    formData.append('purpose', 'proof')

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!uploadRes.ok) {
      setError('فشل رفع الصورة')
      setUploading(false)
      return
    }

    const { url } = await uploadRes.json()

    // Update order with proof URL
    const orderRes = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentProofUrl: url }),
    })

    setUploading(false)

    if (!orderRes.ok) {
      setError('فشل تحديث الطلب')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-amber-100 p-5">
        <p className="text-sm font-medium text-yellow-700">إثبات مُرسل — بانتظار التحقق</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-5">
      <h2 className="font-semibold text-gray-700 mb-1">رفع إثبات الدفع</h2>
      <p className="text-sm text-gray-500 mb-4">
        بعد إتمام التحويل البنكي، أرفق صورة الإيصال
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 mb-4"
      />

      {preview && (
        <Image
          src={preview}
          alt="معاينة"
          width={400}
          height={300}
          className="w-full max-h-48 object-contain rounded-lg border border-gray-200 mb-4"
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {uploading ? 'جارٍ الرفع...' : 'إرسال الإثبات'}
      </button>
    </div>
  )
}
