import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

export default async function AdminPage() {
  const [userCount, bakerCount, orderCount, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.baker.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: 'VERIFIED' },
      _sum: { total: true },
    }),
  ])

  const pendingVerification = await prisma.baker.count({ where: { isVerified: false } })
  const revenue = revenueResult._sum.total ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">لوحة الإدارة</h1>
      <p className="text-gray-500 text-sm mb-8">نظرة عامة على المنصة</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="المستخدمون" value={String(userCount)} />
        <StatCard label="الخبازات" value={String(bakerCount)} />
        <StatCard label="الطلبات" value={String(orderCount)} />
        <StatCard label="الإيرادات المؤكدة" value={formatPrice(revenue)} />
      </div>

      {pendingVerification > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          يوجد <strong>{pendingVerification}</strong> خبازة بانتظار التوثيق —{' '}
          <a href="/admin/bakers" className="underline hover:no-underline">
            راجع الخبازات
          </a>
        </div>
      )}
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
