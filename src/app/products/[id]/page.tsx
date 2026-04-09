import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { AddToCartButton } from './AddToCartButton'
import Link from 'next/link'
import Image from 'next/image'

const categoryEmojis: Record<string, string> = {
  KAAK: '🥐',
  PETITFOUR: '🍪',
  BISCUIT: '🍩',
  MANIN: '🥮',
}

const categoryLabels: Record<string, string> = {
  KAAK: 'كعك',
  PETITFOUR: 'بيتي فور',
  BISCUIT: 'بسكويت',
  MANIN: 'معمول',
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const product = await prisma.product.findUnique({
    where: { id, isAvailable: true },
    include: {
      baker: {
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-amber-700 hover:text-amber-900 text-sm">
            ← الرئيسية
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">{product.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          {/* Product image */}
          <div className="aspect-video bg-amber-50 flex items-center justify-center text-8xl">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{categoryEmojis[product.category] ?? '🍞'}</span>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {categoryLabels[product.category]} · {product.area}
                </p>
              </div>
              <p className="text-2xl font-bold text-amber-700 shrink-0">
                {formatPrice(product.price)}
                <span className="text-sm font-normal text-gray-500">/{product.unit}</span>
              </p>
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm mb-5">{product.description}</p>
            )}

            <div className="border-t border-gray-100 pt-4 mb-6">
              <Link
                href={`/bakers/${product.baker.id}`}
                className="text-sm text-amber-600 hover:underline font-medium"
              >
                {product.baker.user.name}
              </Link>
              <span className="text-sm text-gray-500"> · {product.baker.area}</span>
            </div>

            {session ? (
              session.user.role === 'BUYER' ? (
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  bakerId={product.baker.id}
                  bakerName={product.baker.user.name}
                  price={product.price}
                  unit={product.unit}
                  imageUrl={product.imageUrl}
                />
              ) : (
                <p className="text-sm text-gray-500 text-center py-3">
                  حسابات الخبازين لا يمكنها إجراء طلبات
                </p>
              )
            ) : (
              <Link
                href="/login"
                className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                سجّل دخولك للطلب
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { baker: { select: { user: { select: { name: true } } } } },
  });

  if (!product) return { title: 'المنتج غير موجود' };

  return {
    title: `${product.name} - ${product.baker.user.name}`,
    description: product.description,
    openGraph: {
      title: `${product.name} - ${product.baker.user.name}`,
      description: product.description,
      images: [
        { url: product.imageUrl || '/default-product.jpg', width: 800, height: 600 },
      ],
    },
  };
}
