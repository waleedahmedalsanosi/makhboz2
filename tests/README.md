# Makhboz Test Suite

## Setup

```bash
# Install test dependencies
npm install --save-dev @playwright/test vitest @vitest/ui @faker-js/faker

# Install Playwright browsers
npx playwright install --with-deps chromium

# Copy env template
cp .env.test.example .env.test.local
# Then fill in DATABASE_URL, AUTH_SECRET, and optionally CLOUDINARY_* values
```

## Running Tests

```bash
# Unit tests (Zod schemas, auth callbacks)
npm run test:unit

# Unit tests with UI
npm run test:unit:ui

# API tests (all)
npm run test:api

# API tests — P0 only (critical-path, fast)
npm run test:api -- --grep "@p0"

# E2E tests (Chrome)
npm run test:e2e

# All tests
npm run test
```

### Headed / Debug modes

```bash
# Run E2E headed (visible browser)
npx playwright test --project=e2e --headed

# Playwright debug mode (step-through)
npx playwright test --debug

# Vitest watch mode
npx vitest --watch
```

## Architecture

```
tests/
├── support/
│   ├── auth/
│   │   └── sign-in.ts        # NextAuth v5 cookie helper (CSRF → credentials → cookie)
│   ├── factories/
│   │   └── index.ts          # Direct Prisma factories: createUser, createBaker, createProduct, createOrder
│   └── fixtures/
│       └── index.ts          # Playwright fixture extensions: buyerSession, bakerSession, adminSession, authAs
├── unit/
│   └── validations/
│       └── register.test.ts  # Zod schema unit tests (Vitest)
├── api/
│   ├── auth/
│   │   └── register.spec.ts  # POST /api/auth/register
│   ├── orders/
│   │   ├── orders.spec.ts    # POST/PATCH /api/orders — total, status, ownership
│   │   └── payment-proof.spec.ts  # PATCH /api/orders/:id — Cloudinary URL validation
│   └── upload/
│       └── upload.spec.ts    # POST /api/upload — MIME, size, role
└── e2e/                      # Browser-level flows (Playwright + Chrome)
```

## Best Practices

**Selectors** — use `data-testid` attributes, not CSS classes or text that changes with locale.

**Isolation** — every test creates its own data via factories and cleans up in `afterEach`/`afterAll`. Never depend on seeded data except for role-based sign-in accounts.

**Sign-in** — use `authHeaders(request, 'BUYER'|'BAKER'|'ADMIN')` from `support/auth/sign-in.ts`. This handles CSRF automatically for NextAuth v5.

**Cleanup** — always `await prisma.order.delete(...)` / `await prisma.user.delete(...)` at the end of each test. Order matters: delete dependent records before parents.

**Assertions** — assert both HTTP status code AND response body shape. For error cases, check `body.error` is truthy.

## CI Integration

Tests run in GitHub Actions via `.github/workflows/test.yml`.

```yaml
env:
  DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
  NEXTAUTH_URL: http://localhost:3000
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
```

Playwright API tests use `project: api` (no browser). E2E tests use `project: e2e` (Chromium).

Retries are set to 2 in CI. HTML + JUnit reports are saved to `test-results/`.

## Priority Tags

Tests are tagged with `@p0`, `@p1`, `@p2`, `@p3` in their description:

| Tag | Meaning | Gate |
|-----|---------|------|
| `@p0` | BLOCK — must pass before any deploy | Hard gate |
| `@p1` | MITIGATE — must pass before release | Release gate |
| `@p2` | Important — track regressions | Monitoring |
| `@p3` | Low risk | Nice to have |
