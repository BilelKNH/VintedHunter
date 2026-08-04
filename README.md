# Vinted Opportunity Hunter AI

AI-powered resale opportunity detection platform. Full product spec: [SPECIFICATION.md](./SPECIFICATION.md).

## Status

Phase 4 (Crawler) — automatic Vinted listing collection: BullMQ scheduler + workers
(`apps/worker`), collection/parsing/matching logic (`packages/crawler`). Phases 1–3
(monorepo foundation, backend core API, dashboard) are done.
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
