import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { CartDrawer } from '@/components/CartDrawer'

export const metadata: Metadata = {
  title: 'مخبوز — سوق المخبوزات المنزلية',
  description: 'منصة تربط صانعات المخبوزات المنزلية بالمشترين في السودان',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-amber-50 text-gray-900 antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
