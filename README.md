# مخبوز — Makhboz

منصة سوق رقمية سودانية تربط صانعات المخبوزات المنزلية بالمشترين.

## Stack
- **Frontend + API:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- **Database:** PostgreSQL on Neon · Prisma ORM v6
- **Auth:** NextAuth.js (v5 API)
- **Storage:** Cloudinary (product images + payment proofs)

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/waleedahmedalsanosi/makhboz2.git
cd makhboz2
npm install

# 2. Setup environment
cp .env.example .env.local
# Fill in .env.local with your credentials

# 3. Setup database
npx prisma migrate dev
npx prisma db seed

# 4. Run
npm run dev
```

## Project Structure
See `CLAUDE.md` for full architecture documentation.
