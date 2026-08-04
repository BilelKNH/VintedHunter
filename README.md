# Vinted Opportunity Hunter AI

[![CI](https://github.com/BilelKNH/VintedHunter/actions/workflows/ci.yml/badge.svg)](https://github.com/BilelKNH/VintedHunter/actions/workflows/ci.yml)

AI-powered resale opportunity detection platform for Vinted. It watches saved searches, scores
every new listing for how good a deal it actually is, and pushes an alert the moment something
worth buying shows up.

Full product spec: [SPECIFICATION.md](./SPECIFICATION.md).

## What it does

1. **Crawl** — polls Vinted for each saved search on a schedule, dedupes against what's already
   known, and stores new listings with their price history.
2. **Score** — every new listing gets a rule-based analysis: price vs. estimated market value,
   brand desirability, condition, liquidity, and an authenticity score.
3. **See it** — Claude Vision inspects the listing's own photos: overall photo quality, visible
   defects, OCR'd label/reference text, and whether the logo/branding actually matches what the
   seller claims — feeding straight back into the authenticity score as a fraud signal.
4. **Alert** — listings that clear the opportunity threshold (great price, healthy margin, high
   confidence) get pushed to Discord/Telegram immediately.

## Status

| Phase | What it adds |
|---|---|
| 1–3 | Monorepo foundation, backend core API, dashboard |
| 4 — Crawler | Automatic Vinted listing collection (`packages/crawler`, `apps/worker`) |
| 5 — Intelligence | Scoring engine, market price estimation, Discord/Telegram alerts |
| 6 — Vision AI | Claude Vision photo analysis, OCR, anti-counterfeiting signals |
| 7 — Optimisation | CI (GitHub Actions), Dependabot, Docker hardening, restart/health policies |

Embeddings/vector search, ML/RL, trend detection, a recommendation engine, a chatbot
(SPECIFICATION.md §59-70), and error tracking (Sentry or similar) are intentionally deferred —
see `docs/README.md` for the reasoning behind each phase's scope decisions.

## Architecture

```
apps/
  api/          Fastify REST API — auth, searches, listings, analysis
  worker/       BullMQ workers — crawl, score, vision-analyze, notify
  dashboard/    Next.js dashboard (auth, searches, listings, KPIs)

packages/
  database/       Prisma schema + client
  crawler/        Pure Vinted scraping/parsing/matching logic (no DB/queue access)
  analyzer/       Rule-based scoring engine (title/description analysis, sub-scores)
  pricing-engine/ Market price estimation from comparable listings
  ai-engine/      Claude Vision wrapper — photo quality, defects, OCR, brand/logo checks
  notifications/  Discord webhook + Telegram push formatting/sending
  shared/         Cross-app contracts (BullMQ queue names/job payloads, HTTP helpers)
```

Each `packages/*` is pure and unit-tested with no network or database access; `apps/worker` and
`apps/api` wire them together against real Postgres/Redis. See `docs/README.md` for a deeper
per-phase breakdown of each package.

**Stack:** TypeScript (strict), pnpm workspaces + Turborepo, Fastify, Next.js, Prisma/PostgreSQL,
BullMQ/Redis, Playwright (crawling), Anthropic Claude (vision), Vitest.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DISCORD_WEBHOOK / TELEGRAM_* / ANTHROPIC_API_KEY as needed

# apps/worker launches a real Chromium session for crawling — install the browser
# binary once for local (non-Docker) dev; apps/worker/Dockerfile does this for you
# in the container image.
pnpm --filter worker exec playwright install chromium

# Local infra
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:generate

# Dev (all apps, watch mode)
pnpm dev

# Full stack in Docker
docker compose up -d
```

By default: API on `:3001`, dashboard on `:3000`, Postgres on `:5432`, Redis on `:6379`.

### Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run all apps in watch mode (Turborepo) |
| `pnpm build` | Build all apps/packages |
| `pnpm test` | Run all test suites — prefer `pnpm --filter <pkg> test` per-package locally (see note below) |
| `pnpm lint` / `pnpm typecheck` | Lint / typecheck the whole monorepo |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

> `apps/api` and `tests/e2e` share one Postgres `test` schema with no cross-package concurrency
> guard, so a full `turbo run test` across every package at once can flake. Run each package's
> tests individually (`pnpm --filter <pkg> test`) when iterating locally.

## Environment variables

See [.env.example](./.env.example) for the full list with inline explanations. Everything that
isn't strictly required (notification channels, `ANTHROPIC_API_KEY` for vision) degrades
gracefully when left empty — the feature it powers is simply skipped rather than erroring.

## License

No license has been chosen yet — all rights reserved by default until one is added.
