import type { ComparableSource } from '../types.js';

// A manually-entered price (apps/worker's comparable-listings.repository.ts,
// findManualComparables) is a direct external observation for *this exact item* — a stronger
// signal than "another similar Vinted listing", which is only an approximate match even after
// embedding-similarity filtering (Phase 1). Weights in a plain map, same style as
// brand-factor.ts's HIGH_VALUE_BRANDS — no config, these are product decisions, not tuning knobs.
const SOURCE_WEIGHTS: Record<ComparableSource, number> = {
  manual: 1.5,
  internal: 1,
};

export function weightForSource(source: ComparableSource): number {
  return SOURCE_WEIGHTS[source];
}
