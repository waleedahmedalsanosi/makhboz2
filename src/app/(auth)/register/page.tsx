'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validations'
import type { z } from 'zod'

type RegisterInput = z.input<typeof registerSchema>
type RegisterData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'BUYER' },
  })

  const role = watch('role')

  async function onSubmit(data: RegisterData) {
    setError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error)
      return
    }

    router.push('/login?registered=1')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">إنشاء حساب جديد</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selection */}
        <div className="grid grid-cols-2 gap-3">
          {(['BUYER', 'BAKER'] as const).map((r) => (
            <label
              key={r}
              className={`flex items-center justify-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                role === r
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              <input
                {...register('role')}
                type="radio"
                value={r}
                className="sr-only"
              />
              <span className="text-sm font-medium">
                {r === 'BUYER' ? '🛒 مشتري' : '👩‍🍳 صانعة'}
              </span>
            </label>
          ))}
        </div>
        {errors.role && (
          <p className="text-red-500 text-xs">{errors.role.message}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
          <input
            {...register('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="الاسم الكامل"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="example@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رقم الهاتف
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="09XXXXXXXX"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
          <input
            {...register('area')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="الخرطوم، أم درمان..."
          />
          {errors.area && (
            <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            كلمة المرور
          </label>
          <input
            {...register('password')}
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="6 أحرف على الأقل"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'جارٍ الإنشاء...' : 'إنشاء حساب'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-amber-600 font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
