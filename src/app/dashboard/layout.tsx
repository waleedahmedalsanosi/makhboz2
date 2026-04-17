export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import DashboardClientLayout from './DashboardClientLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== 'BAKER') redirect('/login');

  const baker = await prisma.baker.findUnique({ where: { userId: session.user.id } });
  const pendingProofs = baker
    ? await prisma.order.count({
        where: {
          items: { some: { product: { bakerId: baker.id } } },
          paymentStatus: 'PROOF_SUBMITTED',
        },
      })
    : 0;

  return <DashboardClientLayout pendingProofs={pendingProofs}>{children}</DashboardClientLayout>;
}
