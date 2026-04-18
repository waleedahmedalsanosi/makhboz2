# CI/CD Pipeline Guide

## Overview

Two workflows run on GitHub Actions:

| Workflow | Trigger | Jobs | Target time |
|----------|---------|------|-------------|
| **PR Gate** (`.github/workflows/test.yml`) | Push to `main`/`develop`, PRs | lint → unit → p0-gate → api | < 10 min |
| **Nightly** (`.github/workflows/nightly.yml`) | 02:00 UTC daily, manual | full-suite → burn-in (×2) → notify | < 30 min |

## PR Gate Job Chain

```
lint ──┐
       ├──► p0-gate ──► api (P0+P1)
unit ──┘
```

- **lint**: ESLint — fails fast on code style issues
- **unit**: Vitest — 11 pure-function tests, no DB required
- **p0-gate**: Playwright `--grep "@p0"` — 100% pass rate required; blocks the full API run
- **api**: Playwright `--project=api` — all P0+P1 API tests; check annotations posted to PR

## Nightly Job Chain

```
full-suite ──► burn-in [run-2, run-3] ──► notify (on failure)
```

- **full-suite**: unit + API + E2E (Chromium, `--workers=1`)
- **burn-in**: API tests run 2 more times in parallel (`fail-fast: false`) to surface flaky tests
- **notify**: Posts GitHub Step Summary + Slack message (if `SLACK_WEBHOOK_URL` secret is set)

## Quality Gate Thresholds

| Priority | Pass Rate | Enforcement |
|----------|-----------|-------------|
| P0 | 100% | Hard block — `p0-gate` job fails CI |
| P1 | ≥ 95% | Hard block — `api` job fails CI |
| P2/P3 | Monitor | Nightly only, tracked via artifacts |

## Running CI Locally

Mirror the PR gate pipeline locally:

```bash
# Copy and fill in env file first
cp .env.test.example .env.test.local

# Run full PR gate
bash scripts/ci-local.sh

# Burn-in (3 iterations by default)
bash scripts/burn-in.sh
bash scripts/burn-in.sh 5   # custom iteration count
```

## Artifacts

| Artifact | Retention | Contents |
|----------|-----------|---------|
| `unit-results-*` | 7 days | Vitest output |
| `api-playwright-report-*` | 14 days | HTML report + JUnit XML + traces |
| `nightly-full-report-*` | 30 days | Full suite report |
| `burn-in-failures-*` | 14 days | Only created on failure |

View the HTML report locally:

```bash
npx playwright show-report test-results/html
```

## Neon Database Notes

If your test `DATABASE_URL` points to a Neon serverless database, add connection pooling parameters to prevent exhaustion under 4 parallel Playwright workers:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require&pgbouncer=true&connection_limit=5
```

## Secrets Reference

See [`docs/ci-secrets-checklist.md`](./ci-secrets-checklist.md) for the full list of required and optional secrets.

## Troubleshooting

**Tests pass locally but fail in CI**
Run `bash scripts/ci-local.sh` with `CI=true` set to reproduce the exact CI environment.

**Flaky test identified by burn-in**
Check the `burn-in-failures-*` artifact for traces. Common causes: timing assumptions, shared DB state between parallel workers.

**P0 gate fails but you need to unblock**
Do not bypass — fix the test. P0 failures indicate a broken core flow.

**Playwright browser install slow**
Browser binaries are cached per `package-lock.json` hash. A cache miss only happens when Playwright's version changes.
