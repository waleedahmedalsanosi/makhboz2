import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-l border-gray-200 flex flex-col py-6 px-4 gap-1 shrink-0">
        <Link href="/" className="text-xl font-bold text-amber-800 mb-1 block">
          مخبوز
        </Link>
        <p className="text-xs text-gray-400 mb-4">لوحة الإدارة</p>
        <NavLink href="/admin">الرئيسية</NavLink>
        <NavLink href="/admin/bakers">الخبازات</NavLink>
        <div className="mt-auto">
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-800 py-2">
            الموقع الرئيسي
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg px-3 py-2 transition-colors"
    >
      {children}
    </Link>
  )
}
