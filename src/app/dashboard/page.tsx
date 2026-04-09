import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

export async function generateMetadata() {
  const session = await auth();
  const baker = await prisma.baker.findUnique({
    where: { userId: session?.user.id },
    include: { user: { select: { name: true } } },
  });

  if (!baker) return { title: 'لوحة التحكم' };

  return {
    title: `لوحة التحكم - ${baker.user.name}`,
    description: 'إدارة منتجاتك وطلباتك بسهولة.',
    openGraph: {
      title: `لوحة التحكم - ${baker.user.name}`,
      description: 'إدارة منتجاتك وطلباتك بسهولة.',
      images: [
        { url: baker.imageUrl || '/default-baker.jpg', width: 800, height: 600 },
      ],
    },
  };
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') redirect('/login')

  const baker = await prisma.baker.findUnique({
    where: { userId: session.user.id },
    include: {
      products: { where: { isAvailable: true } },
      _count: { select: { products: true } },
    },
  })

  if (!baker) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { bakerId: baker.id } } } },
    select: { total: true, status: true, paymentStatus: true },
  })

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'VERIFIED')
    .reduce((sum, o) => sum + o.total, 0)

  const pendingOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ACCEPTED'
  ).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        أهلاً، {session.user.name}
      </h1>
      <p className="text-gray-500 text-sm mb-8">لوحة تحكم الخبازة</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="المنتجات النشطة" value={String(baker._count.products)} />
        <StatCard label="طلبات جارية" value={String(pendingOrders)} />
        <StatCard label="إجمالي الإيرادات" value={formatPrice(totalRevenue)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">آخر الطلبات</h2>
        <RecentOrders bakerId={baker.id} />
      </div>
    </div>
  )
}

async function RecentOrders({ bakerId }: { bakerId: string }) {
  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { bakerId } } } },
    include: { user: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (orders.length === 0) {
    return <p className="text-gray-400 text-sm">لا توجد طلبات بعد</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3">
          <div>
            <p className="font-medium text-gray-800">{order.user.name}</p>
            <p className="text-gray-500 text-xs">
              {order.items.map((i) => i.product.name).join('، ')}
            </p>
          </div>
          <div className="text-left">
            <StatusBadge status={order.status} />
            <p className="text-gray-500 text-xs mt-1">{formatPrice(order.total)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    ACCEPTED: 'مقبول',
    PREPARING: 'جارٍ التحضير',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغي',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}
