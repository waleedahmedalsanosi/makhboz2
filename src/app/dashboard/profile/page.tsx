'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  area: z.string().min(2, 'المنطقة يجب أن تكون حرفين على الأقل'),
  bio: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
})

type ProfileData = z.infer<typeof profileSchema>

export default function BakerProfilePage() {
  const [saved, setSaved] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({ resolver: zodResolver(profileSchema) })

  // Load existing profile
  useEffect(() => {
    fetch('/api/baker/profile/me')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          reset({
            area: data.area ?? '',
            bio: data.bio ?? '',
            bankName: data.bankName ?? '',
            bankAccount: data.bankAccount ?? '',
          })
          if (data.imageUrl) {
            setImageUrl(data.imageUrl)
            setImagePreview(data.imageUrl)
          }
        }
      })
      .catch(() => {})
  }, [reset])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('purpose', 'product')
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setImageUrl(url)
    }
  }

  async function onSubmit(data: ProfileData) {
    const res = await fetch('/api/baker/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, imageUrl }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-800 mb-6">الملف الشخصي</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Profile image */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">صورة الملف الشخصي</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center shrink-0">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="صورة" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👩‍🍳</span>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">المعلومات الأساسية</p>

          <Field label="المنطقة" error={errors.area?.message}>
            <input {...register('area')} className="input" placeholder="الخرطوم، أم درمان..." />
          </Field>

          <Field label="نبذة عنك (اختياري)" error={errors.bio?.message}>
            <textarea
              {...register('bio')}
              rows={3}
              className="input resize-none"
              placeholder="أخبري الزبائن عنك وعن منتجاتك..."
            />
          </Field>
        </div>

        {/* Bank */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">بيانات الدفع</p>
          <p className="text-xs text-gray-500">
            تُعرض للمشترين بعد إتمام الطلب لإجراء التحويل البنكي
          </p>

          <Field label="اسم البنك" error={errors.bankName?.message}>
            <input
              {...register('bankName')}
              className="input"
              placeholder="بنك الخرطوم، فيصل الإسلامي..."
            />
          </Field>

          <Field label="رقم الحساب / رقم الهاتف" error={errors.bankAccount?.message}>
            <input
              {...register('bankAccount')}
              className="input"
              placeholder="09XXXXXXXX أو رقم الحساب"
            />
          </Field>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
            تم حفظ الملف الشخصي
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
