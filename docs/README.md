# docs

Architecture and operational docs land here per-phase as they're written. Empty in Phase 1.

## Phase 4 — Crawler

Automatic Vinted listing collection (SPECIFICATION.md §11). Two pieces:

- **`packages/crawler`** — pure collection logic, no database or queue access: builds a Vinted
  search query from a `SearchConfiguration`, paginates the catalog JSON endpoint through an
  injected HTTP client (structurally a Playwright `APIRequestContext`), parses/normalizes raw
  items, and filters them against the search's criteria. Fully unit-tested with fixture data —
  no network calls in tests.
- **`apps/worker`** — the BullMQ runtime that wires the crawler package to Postgres and Redis:
  a scheduler reconciles one repeatable job per enabled `Search` (priority by brand, §11.6),
  the `crawl-search` job processor fetches/filters/persists listings (upserting `Listing`/
  `Seller`, appending `PriceHistory` on price changes), and a Redis-backed cache guard enforces
  `CACHE_DURATION` between runs. The actual browser/session (`src/browser/playwright-session.ts`)
  is a thin, intentionally untested wrapper — everything it feeds into is unit/integration
  tested separately.

Known V1 scope limits (see the crawler package's inline comments for the "why"): single market
(`VINTED_BASE_URL`), no Vinted catalog-ID taxonomy (search is broad, then filtered client-side),
no image-hash dedupe (deferred to Phase 6's AI Vision work).

## Phase 5 — Intelligence

Turns a collected listing into a scored, notified opportunity (SPECIFICATION.md §12, §15,
§24, §46-49). Three new pure packages plus `apps/worker`/`apps/api` wiring:

- **`packages/analyzer`** — rule-based text analysis (title/collection guessing, description
  quality, seller urgency keywords, brand-typo detection) and the scoring engine. §15.2's 8
  weighted criteria are adapted to the `Analysis` model's 5 sub-score columns: "Demande" folds
  into `liquidityScore` (30% combined), "Vendeur" folds into `authenticityScore` (10%
  combined), "Photos" (needs vision/Phase 6) is redistributed into `priceScore` (35%).
  `recommendationForScore` derives the §16 action band purely from `score` — it isn't
  persisted, since the DB has no `recommendation` column.
- **`packages/pricing-engine`** — `MarketPrice = Average Similar Listings + Brand Factor +
Condition Factor + Demand Factor` (§24, implemented literally). "Similar listings" are
  matched by brand+category against Postgres (`apps/worker`'s
  `comparable-listings.repository.ts`), not embeddings — that's Phase 6's §59-60.
- **`packages/notifications`** — push-only Discord webhook + Telegram `sendMessage` alerts
  (§48's exact template), gated by the §47 threshold (score>90, ROI>100%, profit>50€). No
  interactive Telegram bot commands (§49), no Email channel (no SMTP vars provisioned).
- **`apps/worker`** — `crawl-search` now enqueues `analyze-listing` for every newly-collected
  listing (completing §11.4's crawl→analyse→notify pipeline); `analyze-listing` computes and
  upserts the `Analysis` row and enqueues `send-notification` when the analysis clears the §47
  bar; `send-notification` pushes to whichever channels have env vars configured, skipping the
  rest.
- **`apps/api`** — `POST /analysis/:id` (auth required) enqueues an `analyze-listing` job and
  returns `202`; `GET /analysis/:id` reads the persisted `Analysis` (public, `404` until one
  exists) and attaches the derived `recommendation`. The queue name/job-data contract lives in
  `@vinted-hunter/shared` (`src/queues.ts`) so `apps/api` and `apps/worker` agree on it without
  depending on each other.

Deliberate scope decisions, not gaps to be "fixed" without a schema/design change first: no
per-user notification fan-out or `Notification` DB rows yet (there's no Search↔Listing join to
attribute a listing to the user whose search found it — pushes are a single global
Discord/Telegram broadcast for now).

## Phase 6 — Vision AI, OCR & Anti-Counterfeiting

Extends `authenticityScore` with real image-derived signals from Claude Vision (SPECIFICATION.md
§13, §61, §62). Scoped narrowly per an explicit decision: embeddings/vector DB (§59-60), ML/RL
training, trend/seasonal detection, recommendation engine, and chatbot (§63-70) are all deferred.

- **`packages/ai-engine`** — wraps `@anthropic-ai/sdk`. Sends Vinted's own CDN image URLs
  directly as `source: {type: "url"}` content blocks (no download/base64/storage step), capped
  at the first 4 images per listing. Structured output is forced via a single tool
  (`report_vision_analysis`, `tool_choice: {type: "tool", ...}`) — one call, no agentic loop —
  and validated with a zod schema before being trusted. Model: `claude-haiku-4-5` by default
  (`VISION_MODEL`), a deliberate choice over Opus since this runs on every newly-collected
  listing with photos and cost/volume matters more than peak accuracy here.
- **`packages/analyzer`** — `computeAuthenticityScore` gained an optional `vision` signal that
  only ever *penalizes* (brand/logo mismatch, counterfeit-risk flags, very low photo quality) —
  no bonus for good photos, and the no-vision path is byte-identical to Phase 5. A second, lower
  hard cap (`COUNTERFEIT_FLAGGED_SCORE_CAP = 50`, vs. Phase 5's suspiciously-cheap cap of 65)
  keeps a logo-mismatched listing out of the notify path regardless of how good it looks on every
  other axis; both caps can apply and the minimum wins.
- **`apps/worker`** — `analyze-listing.job.ts` calls the vision analyzer (if configured and the
  listing has images) *before* `computeAnalysis`, so the same `Analysis` row Phase 5 already
  computes picks up the vision signal without a second job re-deriving comparables/market price.
  Vision failures are caught and logged, never fail the job — same resilience precedent as
  `send-notification.job.ts` skipping a channel whose env var is missing.
- **Schema** — `Analysis` gained nullable columns (`photoQualityScore`, `defects`,
  `extractedLabelText`, `brandLogoConsistent`, `counterfeitRiskFlags`, `visionAnalyzedAt`); all
  stay `null` when vision wasn't run (no images, no `ANTHROPIC_API_KEY`, or a failed call).
  `GET /analysis/:id` needed no code change — it already spreads the full Prisma row.

Feature-flagged by `ANTHROPIC_API_KEY`: unset it and vision analysis is skipped entirely,
identical to how notification channels degrade when their env vars are absent.

## Phase 7 — Optimisation

SPECIFICATION.md §105 scopes this as "monitoring, tests, CI/CD, sécurité" with a "version
production" deliverable. Scoped pragmatically for a solo, self-hosted tool rather than an
enterprise setup — see the decisions below for what was deliberately left out and why.

- **CI (`.github/workflows/ci.yml`)** — runs on every push/PR to `main`/`develop`: a
  `lint-and-typecheck` job (no DB needed, `prisma generate` only needs the schema file), and a
  `test` job with real Postgres/Redis service containers. Tests run in the same two-phase order
  established manually across Phases 4-6: pure packages (`ai-engine`, `analyzer`, `crawler`,
  `notifications`, `pricing-engine`, `shared`, `dashboard`) in parallel via `turbo run test`,
  then `worker` and `api` sequentially — they share one Postgres `test` schema with no
  cross-package concurrency guard, so running them in parallel flakes (documented above in the
  Phase 5 section already, now enforced by CI instead of just a comment). `tests/e2e`
  (Playwright, needs the full docker-compose stack running) is **not** wired into CI yet — a
  reasonable next step, deliberately left out here to ship a CI pass that's reliable from day
  one rather than flaky.
- **`pnpm audit`** runs in CI but never fails the build (`|| true`) — visibility into known
  vulnerabilities without blocking merges on transitive advisories nobody can act on
  immediately.
- **Dependabot** (`.github/dependabot.yml`) — weekly PRs for npm/pnpm deps, each app's
  Dockerfile base image, and the GitHub Actions versions themselves.
- **Docker hardening** — `apps/api` and `apps/dashboard`'s Dockerfiles now `USER node` (build as
  root, `chown` once, then drop to node:22-alpine's built-in non-root user before `CMD`) — a
  plain Fastify/Next.js process needs no root privileges at runtime. `apps/worker` deliberately
  **stays root**: its Playwright/Chromium session needs either root or dedicated
  seccomp/user-namespace setup to sandbox correctly in a container, and getting that wrong
  silently breaks the crawler — not worth the risk without hardware to actually test it against.
- **docker-compose resilience** — `api`/`dashboard`/`worker` all gained `restart: unless-stopped`
  (postgres/redis already had it); `api`/`dashboard` gained container healthchecks (`wget` against
  `/health` and `/` respectively — no extra package needed, alpine's busybox ships `wget`).
  `worker` has no HTTP server to healthcheck against — process-liveness plus the restart policy
  is the coverage it gets; a real readiness signal would need a dedicated heartbeat endpoint,
  not worth adding just for this.
- **Monitoring — deliberately skipped**: error tracking (e.g. Sentry) was considered and
  explicitly declined — it needs an external account/DSN per app, and the existing structured
  logging (pino in `apps/api`) plus the `/health` endpoint plus the new restart policies already
  cover a solo self-hosted deployment's actual needs. Revisit if this ever needs real uptime
  guarantees or a team operating it.
