'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const categories = [
  { value: '', label: 'الكل' },
  { value: 'KAAK', label: '🥐 كعك' },
  { value: 'PETITFOUR', label: '🍪 بيتي فور' },
  { value: 'BISCUIT', label: '🍩 بسكويت' },
  { value: 'MANIN', label: '🥮 معمول' },
]

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const active = searchParams.get('category') ?? ''
  const area = searchParams.get('area') ?? ''
  const search = searchParams.get('search') ?? ''

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Search by name */}
      <input
        type="text"
        defaultValue={search}
        onChange={(e) => setParam('search', e.target.value)}
        placeholder="ابحث عن منتج..."
        className="w-full text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-amber-400 bg-white"
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* Category filters */}
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setParam('category', cat.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              active === cat.value
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
            }`}
          >
            {cat.label}
          </button>
        ))}

        {/* Area search */}
        <input
          type="text"
          defaultValue={area}
          onChange={(e) => setParam('area', e.target.value)}
          placeholder="ابحث بالمنطقة..."
          className="text-sm border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-amber-400 bg-white"
        />
      </div>
    </div>
  )
}
