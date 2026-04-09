"use client";

import Link from 'next/link';

function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
  return (
    <Link href={href} className="text-sm text-gray-700 hover:text-amber-800 flex items-center gap-2">
      {children}
      {badge ? (
        <span className="bg-amber-800 text-white text-xs rounded-full px-2 py-0.5">{badge}</span>
      ) : null}
    </Link>
  );
}

export default function DashboardClientLayout({
  children,
  pendingProofs,
}: {
  children: React.ReactNode;
  pendingProofs: number;
}) {
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
          {/* Additional client-side content */}
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}