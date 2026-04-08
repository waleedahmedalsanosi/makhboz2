@AGENTS.md

# مخبوز — Makhboz Platform
## Project Context
منصة سوق رقمية سودانية (C2C Marketplace) تربط صانعات المخبوزات المنزلية بالمشترين.
Stack: Next.js 16 · TypeScript · Tailwind CSS v4 · Prisma ORM v7 · PostgreSQL (Neon) · NextAuth.js (v5 API) · Cloudinary

## Commands
```bash
npm run dev          # localhost:3000
npm run build        # production build
npm run lint         # eslint check
npx prisma studio    # DB UI on localhost:5555
npx prisma migrate dev --name <n>
npx prisma generate
```

## Architecture
```
src/
├── app/
│   ├── (auth)/           # login, register — Route Group (not in URL)
│   ├── (shop)/products/[id]/
│   ├── dashboard/        # baker only — protected by middleware
│   ├── orders/           # buyer orders
│   └── api/              # API Routes
├── lib/
│   ├── db.ts             # Prisma singleton — ALWAYS import prisma from here
│   ├── auth.ts           # NextAuth config — exports { handlers, auth, signIn, signOut }
│   ├── utils.ts          # cn(), formatPrice()
│   └── validations.ts    # Zod schemas
└── types/index.ts
```

## Business Rules — Read Before Any Edit
1. Payment is MANUAL — user uploads bank transfer screenshot, baker confirms
2. PaymentStatus flow: AWAITING_PROOF → PROOF_SUBMITTED → VERIFIED/REJECTED
3. Order total ALWAYS calculated server-side from Prisma — never trust client values
4. Payment proof images uploaded to Cloudinary with type:"authenticated" (private)
5. Dashboard is BAKER-only, protected by Middleware
6. Home page is a Server Component — fetches from Prisma directly (SSR)
7. Baker profile is a separate model (Baker) linked 1:1 to User via userId

## Database Models
- **User** — id, email, password, name, phone, role (UserRole)
- **Baker** — id, userId, bio, area, imageUrl, bankName, bankAccount, rating, isVerified
- **Product** — id, name, price, category, area, unit, imageUrl, isAvailable, bakerId
- **Order** — id, userId, status, paymentStatus, paymentProofUrl, deliveryAddress, total
- **OrderItem** — orderId, productId, quantity, price
- **Review** — orderId (unique), rating, comment

## Database Enums
- UserRole: BUYER | BAKER | ADMIN
- ProductCategory: KAAK | PETITFOUR | BISCUIT | MANIN
- OrderStatus: PENDING | ACCEPTED | PREPARING | DELIVERED | CANCELLED
- PaymentStatus: AWAITING_PROOF | PROOF_SUBMITTED | VERIFIED | REJECTED

## Code Rules
- TypeScript strict — no `any` without a comment explaining why
- Server Components by default — add 'use client' only when needed
- Tailwind CSS only — no inline styles
- Arabic RTL — dir="rtl" set in root layout
- Zod validation on every API Route input
- Never create a new PrismaClient — always import `prisma` from '@/lib/db'
- Auth uses NextAuth v5 API style: `auth()` (not `getServerSession()`)

## Environment Variables
```
DATABASE_URL              # Neon PostgreSQL (Pooled connection) — needs ?sslmode=require
AUTH_SECRET               # NextAuth secret
NEXTAUTH_URL              # http://localhost:3000 (dev) | https://domain (prod)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

## Lessons (append when Claude makes a mistake)
- DATABASE_URL needs ?sslmode=require with Neon
- postinstall:"prisma generate" required in package.json for Vercel
- Route Groups (auth) (shop) don't appear in URL — for organization only
- Cloudinary type:"authenticated" for payment proofs — not type:"upload"
- Auth exports { handlers, auth, signIn, signOut } = NextAuth(...) — v5 API style
- Baker is a separate model, not just a role — always check Baker table for baker-specific data
