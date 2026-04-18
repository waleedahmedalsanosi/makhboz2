#!/bin/bash
# ci-local.sh — mirror the PR gate pipeline locally
# Usage: bash scripts/ci-local.sh
set -euo pipefail

echo "==> [ci-local] Makhboz PR Gate (local mirror)"

# Require DATABASE_URL and AUTH_SECRET
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Copy .env.test.example to .env.test.local and fill it in."
  exit 1
fi
if [ -z "${AUTH_SECRET:-}" ]; then
  echo "ERROR: AUTH_SECRET is not set."
  exit 1
fi

export CI=true
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

echo ""
echo "--- Lint ---"
npm run lint

echo ""
echo "--- Unit tests ---"
npm run test:unit

echo ""
echo "--- DB migrations ---"
npx prisma migrate deploy

echo ""
echo "--- P0 strict gate ---"
npx playwright test --project=api --grep "@p0"

echo ""
echo "--- API tests (P0 + P1) ---"
npm run test:api

echo ""
echo "==> All checks passed."
