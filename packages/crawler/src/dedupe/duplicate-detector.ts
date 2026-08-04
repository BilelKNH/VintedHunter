import { createHash } from 'node:crypto';

// §11.9 dedupe methods: externalId is the primary key (enforced by the DB's unique
// constraint — see apps/worker's crawl-listings repository). hashUrl below is a
// secondary/defensive key in case externalId is ever unavailable — not currently consulted
// by apps/worker, kept for that fallback case. normalizer/normalize-listing.ts also computes
// a contentHash per listing (title+price+description), but apps/worker's actual change
// detection today only compares price directly — contentHash isn't read anywhere yet; it's
// reserved for richer (title/description) change detection, not live. Image-hash comparison
// is deferred to Phase 6 (AI Vision, §61) — see the plan's assumption #4.
export function hashUrl(url: string): string {
  const normalized = url.trim().toLowerCase().replace(/\/+$/, '');
  return createHash('sha256').update(normalized).digest('hex');
}

export function hasContentChanged(previousHash: string, nextHash: string): boolean {
  return previousHash !== nextHash;
}
