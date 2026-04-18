import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import http from 'http'

dotenv.config({ path: path.resolve(__dirname, '../.env.test.local') })

const prisma = new PrismaClient()

async function upsertUser(email: string, password: string, role: 'BUYER' | 'BAKER' | 'ADMIN') {
  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: `Test ${role}`,
      password: hashed,
      phone: '0912345678',
      role,
    },
  })
}

async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      return
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

async function globalSetup() {
  await connectWithRetry()
  const buyerEmail = process.env.TEST_BUYER_EMAIL ?? 'buyer@test.local'
  const bakerEmail = process.env.TEST_BAKER_EMAIL ?? 'baker@test.local'
  const adminEmail = process.env.TEST_ADMIN_EMAIL ?? 'admin@test.local'
  const password = process.env.TEST_BUYER_PASSWORD ?? 'Password123'

  await upsertUser(buyerEmail, password, 'BUYER')
  await upsertUser(adminEmail, password, 'ADMIN')

  const hashedBaker = await bcrypt.hash(process.env.TEST_BAKER_PASSWORD ?? 'Password123', 10)
  const baker = await prisma.user.upsert({
    where: { email: bakerEmail },
    update: {},
    create: {
      email: bakerEmail,
      name: 'Test BAKER',
      password: hashedBaker,
      phone: '0912345678',
      role: 'BAKER',
    },
  })

  const existingBaker = await prisma.baker.findUnique({ where: { userId: baker.id } })
  if (!existingBaker) {
    await prisma.baker.create({
      data: {
        userId: baker.id,
        area: 'الخرطوم',
        isVerified: true,
      },
    })
  }

  await prisma.$disconnect()

  // Pre-warm Turbopack: visit each route concurrently so pages compile before tests run
  const base = process.env.BASE_URL ?? 'http://localhost:3000'
  const routes = [
    '/', '/login', '/register', '/checkout',
    '/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/products/new',
    '/orders', '/orders/_warmup',
    '/admin/bakers',
    '/products/_warmup', '/bakers/_warmup',
  ]
  await Promise.all(
    routes.map(
      (route) =>
        new Promise<void>((resolve) => {
          http.get(`${base}${route}`, (res) => { res.resume(); res.on('end', resolve) }).on('error', () => resolve())
        })
    )
  )
}

export default globalSetup
