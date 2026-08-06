// Exponential decay — a comparable's influence on the weighted average halves every
// HALF_LIFE_DAYS. Keeps stale internal comparables and old manual entries from dominating the
// estimate the way a plain average would.
const HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeRecencyWeight(observedAt: string, now: Date = new Date()): number {
  const ageDays = Math.max(0, (now.getTime() - new Date(observedAt).getTime()) / MS_PER_DAY);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}
