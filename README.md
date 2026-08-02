# Vinted Opportunity Hunter AI

AI-powered resale opportunity detection platform. Full product spec: [SPECIFICATION.md](./SPECIFICATION.md).

## Status

Phase 1 (Fondation) — monorepo skeleton, Docker, PostgreSQL/Prisma, Redis, code-quality tooling.
See `SPECIFICATION.md` §105 for the full phase roadmap.

## Getting started

```bash
pnpm install
cp .env.example .env   # already done in this repo; edit values as needed

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
