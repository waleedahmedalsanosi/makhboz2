'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema } from '@/lib/validations'
import { useState } from 'react'
import type { z } from 'zod'
import type { Product } from '@prisma/client'
import { ProductImageUpload } from '../../ProductImageUpload'

type ProductData = z.input<typeof productSchema>

const categories = [
  { value: 'KAAK', label: 'كعك' },
  { value: 'PETITFOUR', label: 'بيتي فور' },
  { value: 'BISCUIT', label: 'بسكويت' },
  { value: 'MANIN', label: 'معمول' },
]

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      description: product.description ?? undefined,
      price: product.price,
      category: product.category as ProductData['category'],
      area: product.area,
      unit: product.unit,
      imageUrl: product.imageUrl ?? undefined,
      isAvailable: product.isAvailable,
    },
  })

  async function onSubmit(data: ProductData) {
    setError(null)
    const payload = {
      ...data,
      imageUrl: data.imageUrl || undefined,
      description: data.description || undefined,
    }
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error)
      return
    }
    router.push('/dashboard/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Field label="صورة المنتج">
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ProductImageUpload
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="اسم المنتج" error={errors.name?.message}>
        <input {...register('name')} className="input" placeholder="كعك بالسمسم" />
      </Field>

      <Field label="الوصف (اختياري)" error={errors.description?.message}>
        <textarea
          {...register('description')}
          className="input min-h-20 resize-none"
          placeholder="وصف قصير للمنتج..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="السعر (جنيه)" error={errors.price?.message}>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="1"
            className="input"
            placeholder="50"
          />
        </Field>

        <Field label="الوحدة" error={errors.unit?.message}>
          <input {...register('unit')} className="input" placeholder="كيلو / قطعة / علبة" />
        </Field>
      </div>

      <Field label="الفئة" error={errors.category?.message}>
        <select {...register('category')} className="input">
          <option value="">اختر الفئة</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>

      <Field label="المنطقة" error={errors.area?.message}>
        <input {...register('area')} className="input" placeholder="الخرطوم، أم درمان..." />
      </Field>

      <div className="flex items-center gap-3">
        <input
          {...register('isAvailable')}
          type="checkbox"
          id="isAvailable"
          className="w-4 h-4 accent-amber-600"
        />
        <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
          المنتج متاح للطلب
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
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
