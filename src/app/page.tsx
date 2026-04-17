
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { formatPrice } from '@/lib/utils'
import { ProductFilters } from '@/components/ProductFilters'
import { CartButton } from '@/components/CartButton'
import { BakerLink } from '@/components/BakerLink'
import Image from 'next/image'
import Link from 'next/link'
import type { ProductCategory } from '@prisma/client'

const VALID_CATEGORIES = ['KAAK', 'PETITFOUR', 'BISCUIT', 'MANIN']

const categoryEmojis: Record<string, string> = {
  KAAK: '🥐',
  PETITFOUR: '🍪',
  BISCUIT: '🍩',
  MANIN: '🥮',
}


export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; area?: string; search?: string }>
}) {
  const session = await auth()
  const { category, area, search } = await searchParams

  const validCategory = category && VALID_CATEGORIES.includes(category)
    ? (category as ProductCategory)
    : undefined

  const products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      ...(validCategory ? { category: validCategory } : {}),
      ...(area ? { area: { contains: area, mode: 'insensitive' } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: { baker: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navbar */}
      <header className="bg-white border-b border-amber-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-amber-800">مخبوز</h1>
          <nav className="flex items-center gap-4">
            <CartButton />
            {session ? (
              <>
                {session.user.role === 'BAKER' && (
                  <Link href="/dashboard" className="text-sm text-amber-700 hover:text-amber-900 font-medium">
                    لوحة التحكم
                  </Link>
                )}
                <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                  طلباتي
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  خروج
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  دخول
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-8 pb-4 text-center">
        <h2 className="text-3xl font-bold text-amber-900 mb-2">مخبوزات منزلية طازجة</h2>
        <p className="text-gray-600">اطلب مباشرة من صانعات المخبوزات في منطقتك</p>
      </section>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Suspense>
          <ProductFilters />
        </Suspense>
      </div>

      {/* Products grid */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا توجد منتجات متاحة</p>
            {!session && (
              <Link
                href="/register"
                className="inline-block mt-4 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-amber-700"
              >
                انضمي كخبازة
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white rounded-xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-amber-50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={product.imageUrl || '/default-product.jpg'}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                  <BakerLink bakerId={product.baker.id}>{product.baker.user.name}</BakerLink>
                  <p className="text-xs text-gray-400">{product.area}</p>
                  <p className="text-amber-700 font-semibold text-sm mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
