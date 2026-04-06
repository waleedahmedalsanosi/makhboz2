# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**مخبوز** — a Sudanese home-bakery marketplace connecting bakers with customers in Khartoum. Arabic-first, RTL UI.

## Development Commands

```bash
npm run dev      # Serve frontend locally on http://localhost:8000 (Python HTTP server)
npm run build    # No-op — static site, no build step
```

There are no tests. No linter configured.

## Deployment

**Vercel** is the production target. The `api/` directory contains TypeScript serverless functions auto-detected by Vercel. Static files are served from the repo root (`outputDirectory: "."`).

**Required environment variables in Vercel:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BLOB_READ_WRITE_TOKEN` — for product image uploads via `@vercel/blob`

The `netlify/` directory and `netlify.toml` are an alternative deployment target (Netlify). Those functions still use `@netlify/blobs` and are independent of `api/`.

## Architecture

### Frontend (static)
- `index.html` — marketplace homepage with product grid, category/area filters, search
- `pages/` — login, cart, checkout, orders, product detail, baker profile
- `dashboard.html` — baker admin panel (English)
- `css/style.css` — all styles; CSS variables for the color scheme (teal/cream/brown)
- `js/app.js` — shared `App` singleton loaded on every page

### `App` singleton (`js/app.js`)
All pages share this global object. It handles:
- Auth state: `App.user` (from `localStorage`), `App.getToken()`, `App.authHeaders()`
- Cart: fully localStorage-based (`makhboz_cart`)
- Nav rendering: `App.renderNav()` injects the `#main-nav` element on `DOMContentLoaded`
- Utility helpers: `formatPrice`, `categoryEmoji`, `categoryName`, `areaName`, `statusName`, `timeAgo`, `showAlert`

localStorage keys: `makhboz_user`, `makhboz_token`, `makhboz_cart`

### API (`api/` — Vercel serverless functions)
Each file maps to one endpoint by filename. Storage is Upstash Redis via `Redis.fromEnv()`.

| File | Endpoint | Purpose |
|------|----------|---------|
| `auth.ts` | `POST /api/auth` | `action`: `register` / `login` / `verify` |
| `products.ts` | `/api/products` | GET (list/single), POST, PUT, DELETE |
| `orders.ts` | `/api/orders` | GET (list/single), POST (create or `updateStatus`) |
| `analytics.ts` | `/api/analytics` | POST (track pageview), GET (daily stats) |
| `counts.ts` | `/api/counts` | GET/POST visitor & role counters |
| `seed.ts` | `POST /api/seed` | Populate sample products (idempotent) |
| `upload.ts` | `POST /api/upload` | Upload product image to Vercel Blob (baker auth required) |

**Redis key namespaces:**
- `users:` — `phone-index`, `user-{id}`, `token-{token}`
- `products:` — `products-index` (array of IDs), `product-{id}`
- `orders:` — `order-{id}`, `customer-orders-{id}`, `baker-orders-{id}`
- `analytics:` — `daily:{YYYY-MM-DD}`, `totals`
- `counters:` — `counts`

**Auth pattern:** Token = `userId.timestamp.random` stored as `users:token-{token}` in Redis. `getUser(req)` helper (duplicated in products/orders) reads `Authorization: Bearer <token>` → looks up token → looks up user.

### Data model
- **Users**: `{ id, name, phone, passwordHash, area, role }` — roles: `customer`, `baker`, `driver`
- **Products**: `{ id, bakerId, bakerName, bakerArea, name, category, description, price, unit, minOrder, available, occasions[], area, emoji }`
  - Categories: `kaak`, `petitfour`, `biscuit`, `manin`
  - Areas: `bahri`, `omdurman`, `khartoum`, `khartoum-north`
- **Orders**: `{ id, customerId, customerName, customerPhone, items[], total, area, address, paymentMethod, notes, status }`
  - Statuses: `pending` → `confirmed` → `preparing` → `delivering` → `delivered` / `cancelled`

### Products listing pattern
`products-index` is an array of IDs. All filters (category, area, search, bakerId) are applied in-memory by iterating each product individually — there is no server-side indexed query.
