#!/bin/bash
# burn-in.sh — run API tests N times to detect flaky behaviour
# Usage: bash scripts/burn-in.sh [iterations]
set -euo pipefail

ITERATIONS="${1:-3}"

echo "==> [burn-in] Running API tests ${ITERATIONS} time(s)"

export CI=true
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

for i in $(seq 1 "$ITERATIONS"); do
  echo ""
  echo "--- Iteration $i / $ITERATIONS ---"
  if ! npm run test:api; then
    echo "FAILED on iteration $i"
    exit 1
  fi
done

echo ""
echo "==> Burn-in complete — all $ITERATIONS runs passed."
