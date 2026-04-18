import { test as base, expect } from '@playwright/test'
import { authHeaders, type Role } from '../auth/sign-in'
import {
  prisma,
  createUser,
  createBaker,
  createProduct,
  createOrder,
  type UserSeed,
  type BakerSeed,
  type ProductSeed,
} from '../factories'

export { expect }

interface Fixtures {
  /** Authenticated cookie headers for a given role — call authAs(role) to get headers */
  authAs: (role: Role) => Promise<{ cookie: string }>
  /** Pre-created BUYER user + auth headers */
  buyerSession: { cookie: string; userId: string; email: string }
  /** Pre-created BAKER user + baker record + auth headers */
  bakerSession: { cookie: string; userId: string; bakerId: string; email: string }
  /** Pre-created ADMIN user + auth headers */
  adminSession: { cookie: string; userId: string; email: string }
}

export const test = base.extend<Fixtures>({
  authAs: async ({ request }, use) => {
    await use((role) => authHeaders(request, role))
  },

  buyerSession: async ({ request }, use) => {
    const ts = Date.now()
    const email = `buyer-${ts}@test.local`
    const user = await createUser({ email, role: 'BUYER' })
    const cookie = await (await authHeaders(request, 'BUYER')).cookie

    await use({ cookie, userId: user.id, email })

    await prisma.user.deleteMany({ where: { id: user.id } })
  },

  bakerSession: async ({ request }, use) => {
    const ts = Date.now()
    const email = `baker-${ts}@test.local`
    const { user, baker } = await createBaker({ email }, { isVerified: true })
    const cookie = await (await authHeaders(request, 'BAKER')).cookie

    await use({ cookie, userId: user.id, bakerId: baker.id, email })

    await prisma.user.deleteMany({ where: { id: user.id } })
  },

  adminSession: async ({ request }, use) => {
    const ts = Date.now()
    const email = `admin-${ts}@test.local`
    const user = await createUser({ email, role: 'ADMIN' })
    const cookie = await (await authHeaders(request, 'ADMIN')).cookie

    await use({ cookie, userId: user.id, email })

    await prisma.user.deleteMany({ where: { id: user.id } })
  },
})

export { createUser, createBaker, createProduct, createOrder, prisma }
export type { UserSeed, BakerSeed, ProductSeed }
