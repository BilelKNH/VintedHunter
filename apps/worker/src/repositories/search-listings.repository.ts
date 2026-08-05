import type { PrismaClient } from '@vinted-hunter/database';

// Generous margin above the shortest legal Search.frequency (15 minutes, enforced elsewhere) —
// no enabled search can legitimately go this long without a crawl re-touching lastSeenAt, so
// anything still stale past this point is genuinely no longer appearing in results, not just
// waiting on a slow-frequency search's next tick.
const DELISTED_AFTER_MS = 6 * 60 * 60 * 1000;

// Foundation for a future resale-time estimate (§8 of the architecture note) — nothing reads
// delistedAt yet. Marks SearchListing rows whose listing hasn't been re-seen by that search's
// own crawls in a while; a listing can still be "live" for another search that keeps finding it.
export async function markDelistedSearchListings(prisma: PrismaClient): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "search_listings"
    SET "delistedAt" = now()
    WHERE "delistedAt" IS NULL
      AND "lastSeenAt" < now() - (${DELISTED_AFTER_MS}::text || ' milliseconds')::interval
  `;
  return result;
}
