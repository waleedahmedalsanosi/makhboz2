import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image';

const categoryEmojis: Record<string, string> = {
  KAAK: '🥐',
  PETITFOUR: '🍪',
  BISCUIT: '🍩',
  MANIN: '🥮',
}

export default async function BakerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [baker, reviews] = await Promise.all([
    prisma.baker.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        products: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { products: true } },
      },
    }),
    prisma.review.findMany({
      where: { order: { items: { some: { product: { bakerId: id } } } } },
      include: { order: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  if (!baker) notFound()

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-amber-700 hover:text-amber-900 text-sm">
            ← الرئيسية
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Baker profile card */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center shrink-0">
              {baker.imageUrl ? (
                <Image
                  src={baker.imageUrl}
                  alt={baker.user.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">👩‍🍳</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{baker.user.name}</h1>
                {baker.isVerified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    ✓ موثق
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{baker.area}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                {baker.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    {baker.rating.toFixed(1)}
                    {reviews.length > 0 && <span>({reviews.length})</span>}
                  </span>
                )}
                <span>{baker._count.products} منتج</span>
              </div>
            </div>
          </div>
          {baker.bio && (
            <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
              {baker.bio}
            </p>
          )}
        </div>

        {/* Products */}
        <h2 className="font-semibold text-gray-700 mb-4">المنتجات المتاحة</h2>

        {baker.products.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">لا توجد منتجات متاحة حالياً</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {baker.products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white rounded-xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-amber-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">
                      {categoryEmojis[product.category] ?? '🍞'}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                  <p className="text-amber-700 font-semibold text-sm mt-1">
                    {formatPrice(product.price)}
                    <span className="text-xs text-gray-400 font-normal">/{product.unit}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">
              التقييمات ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-amber-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">
                      {review.order.user.name}
                    </p>
                    <span className="text-amber-500 text-sm">
                      {'★'.repeat(review.rating)}
                      <span className="text-gray-200">{'★'.repeat(5 - review.rating)}</span>
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
