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

Analysis/scoring and notifications (the `analyze-listing` / `send-notification` queues from
§23) are Phase 5 — not built yet.
