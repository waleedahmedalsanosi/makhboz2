import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== 'BAKER') redirect('/login')

  const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } })
  const pendingProofs = baker
    ? await prisma.order.count({
        where: {
          items: { some: { product: { bakerId: baker.id } } },
          paymentStatus: 'PROOF_SUBMITTED',
        },
      })
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-l border-gray-200 flex flex-col py-6 px-4 gap-1 shrink-0">
        <Link href="/" className="text-xl font-bold text-amber-800 mb-6 block">
          مخبوز
        </Link>
        <NavLink href="/dashboard">الرئيسية</NavLink>
        <NavLink href="/dashboard/products">المنتجات</NavLink>
        <NavLink href="/dashboard/orders" badge={pendingProofs}>
          الطلبات
        </NavLink>
        <NavLink href="/dashboard/profile">الملف الشخصي</NavLink>
        <div className="mt-auto">
          <Link
            href="/api/auth/signout"
            className="block text-sm text-gray-500 hover:text-gray-800 py-2"
          >
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({
  href,
  children,
  badge,
}: {
  href: string
  children: React.ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg px-3 py-2 transition-colors flex items-center justify-between"
    >
      <span>{children}</span>
      {badge ? (
        <span className="bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
