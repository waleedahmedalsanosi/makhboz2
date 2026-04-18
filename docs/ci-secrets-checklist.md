# CI Secrets Checklist

Set these in: **GitHub → Repository Settings → Secrets and variables → Actions**

## Required (tests will not run without these)

| Secret | Description | Example |
|--------|-------------|---------|
| `TEST_DATABASE_URL` | Neon (or other) PostgreSQL test branch URL | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | NextAuth signing secret (32+ random chars) | `openssl rand -base64 32` |

## Required for sign-in helpers

These seed the test users created by `global-setup.ts`:

| Secret | Default (if not set) | Description |
|--------|---------------------|-------------|
| `TEST_BUYER_EMAIL` | `buyer@test.local` | Email for seeded BUYER test user |
| `TEST_BUYER_PASSWORD` | `Password123` | Password for seeded BUYER test user |
| `TEST_BAKER_EMAIL` | `baker@test.local` | Email for seeded BAKER test user |
| `TEST_BAKER_PASSWORD` | `Password123` | Password for seeded BAKER test user |
| `TEST_ADMIN_EMAIL` | `admin@test.local` | Email for seeded ADMIN test user |
| `TEST_ADMIN_PASSWORD` | `Password123` | Password for seeded ADMIN test user |

> **Security note**: Always override the defaults in production CI. The defaults are only safe for local development.

## Optional (some tests skip gracefully without these)

| Secret | Description | Affects |
|--------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | TC-S02-P1-018 (JPEG upload) — skips if not set |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Same as above |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Same as above |

## Optional (notifications)

| Secret | Description |
|--------|-------------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL for nightly failure alerts |

## Verification

After adding secrets, push a commit to `main` or open a PR to trigger the first run. Verify:

1. All jobs appear in the Actions tab
2. `unit` passes within ~30 seconds
3. `p0-gate` starts after lint + unit complete
4. `api` starts after `p0-gate` completes
5. HTML report artifact is uploaded after the run

## Neon Test Branch Setup

Recommended: create a dedicated Neon branch for CI testing to avoid affecting production data.

```bash
# Using Neon CLI
neon branch create --name ci-test --project-id <your-project-id>
neon connection-string --branch ci-test
```

Add `?pgbouncer=true&connection_limit=5` to the connection string to prevent pool exhaustion under parallel test runs.
