import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export { prisma }

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserSeed {
  email?: string
  name?: string
  password?: string
  phone?: string
  role?: 'BUYER' | 'BAKER' | 'ADMIN'
}

export async function createUser(overrides: UserSeed = {}) {
  const ts = Date.now()
  const role = overrides.role ?? 'BUYER'
  const hashedPassword = await bcrypt.hash(overrides.password ?? 'Password123', 10)

  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${ts}@test.local`,
      name: overrides.name ?? `Test User ${ts}`,
      password: hashedPassword,
      phone: overrides.phone ?? '0912345678',
      role,
    },
  })
}

// ─── Baker ───────────────────────────────────────────────────────────────────

export interface BakerSeed {
  area?: string
  isVerified?: boolean
  bankName?: string
  bankAccount?: string
}

export async function createBaker(userOverrides: UserSeed = {}, bakerOverrides: BakerSeed = {}) {
  const user = await createUser({ ...userOverrides, role: 'BAKER' })
  const baker = await prisma.baker.create({
    data: {
      userId: user.id,
      area: bakerOverrides.area ?? 'الخرطوم',
      isVerified: bakerOverrides.isVerified ?? false,
      bankName: bakerOverrides.bankName,
      bankAccount: bakerOverrides.bankAccount,
    },
  })
  return { user, baker }
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductSeed {
  name?: string
  price?: number
  category?: 'KAAK' | 'PETITFOUR' | 'BISCUIT' | 'MANIN'
  area?: string
  isAvailable?: boolean
  imageUrl?: string
}

export async function createProduct(bakerId: string, overrides: ProductSeed = {}) {
  const ts = Date.now()
  return prisma.product.create({
    data: {
      bakerId,
      name: overrides.name ?? `Product ${ts}`,
      price: overrides.price ?? 100,
      category: overrides.category ?? 'KAAK',
      area: overrides.area ?? 'الخرطوم',
      isAvailable: overrides.isAvailable ?? true,
      imageUrl: overrides.imageUrl,
    },
  })
}

// ─── Order ───────────────────────────────────────────────────────────────────

export async function createOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number; price: number }>,
  overrides: { deliveryAddress?: string; status?: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERED' | 'CANCELLED' } = {}
) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  return prisma.order.create({
    data: {
      userId,
      deliveryAddress: overrides.deliveryAddress ?? 'شارع الجامعة، الخرطوم',
      total,
      status: overrides.status ?? 'PENDING',
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
    include: { items: true },
  })
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export async function cleanupUser(email: string) {
  await prisma.user.deleteMany({ where: { email } })
}

export async function cleanupUsers(emails: string[]) {
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
}

export async function disconnectPrisma() {
  await prisma.$disconnect()
}
