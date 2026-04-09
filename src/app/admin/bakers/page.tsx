import { prisma } from '@/lib/db'
import { VerifyButton } from './VerifyButton'

export default async function AdminBakersPage() {
  const bakers = await prisma.baker.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">الخبازات</h1>

      {bakers.length === 0 ? (
        <p className="text-gray-400 text-sm">لا توجد خبازات مسجلة بعد</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-right px-4 py-3 font-medium">الاسم</th>
                <th className="text-right px-4 py-3 font-medium">البريد</th>
                <th className="text-right px-4 py-3 font-medium">المنطقة</th>
                <th className="text-right px-4 py-3 font-medium">التقييم</th>
                <th className="text-right px-4 py-3 font-medium">المنتجات</th>
                <th className="px-4 py-3 font-medium text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bakers.map((baker) => (
                <tr key={baker.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{baker.user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{baker.user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{baker.area}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {baker.rating > 0 ? (
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        {baker.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{baker._count.products}</td>
                  <td className="px-4 py-3">
                    <VerifyButton bakerId={baker.id} isVerified={baker.isVerified} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
