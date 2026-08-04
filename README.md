# Vinted Opportunity Hunter AI

AI-powered resale opportunity detection platform. Full product spec: [SPECIFICATION.md](./SPECIFICATION.md).

## Status

Phase 5 (Intelligence) — every newly-collected listing is automatically scored: text analysis +
scoring engine (`packages/analyzer`), market price estimation (`packages/pricing-engine`),
Discord/Telegram push alerts (`packages/notifications`), wired together by two new
`apps/worker` jobs (`analyze-listing`, `send-notification`) and a new `POST/GET /analysis/:id`
API. Phases 1–4 (monorepo foundation, backend core API, dashboard, crawler) are done.
See `SPECIFICATION.md` §105 for the full phase roadmap.

## Getting started

```bash
pnpm install
cp .env.example .env   # already done in this repo; edit values as needed

# apps/worker launches a real Chromium session (packages/crawler's Vinted client) — install
# the browser binary once for local (non-Docker) dev; apps/worker/Dockerfile does this for you
# in the container image.
pnpm --filter worker exec playwright install chromium

# Local infra
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:generate

# Dev
pnpm dev

# Full stack in Docker
docker compose up -d
```

## Structure

```
apps/            api (Fastify), dashboard (Next.js), worker (BullMQ, Phase 4+)
packages/        database (Prisma), crawler, analyzer, pricing-engine, ai-engine,
                 notifications, shared
```
