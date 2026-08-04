// Minimal slice of ioredis's Redis client — a real instance satisfies this structurally.
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'PX', duration: number): Promise<unknown>;
}

export interface CrawlCache {
  shouldSkip(searchId: string): Promise<boolean>;
  markCrawled(searchId: string): Promise<void>;
}

function cacheKey(searchId: string): string {
  return `crawler:last-crawled:${searchId}`;
}

// §11.7 CACHE_DURATION guard: avoids re-crawling the same search if a repeatable job and a
// manual trigger happen to overlap within the cache window. Manual triggers bypass this (see
// jobs/crawl-search.job.ts).
export function createCrawlCache(redis: RedisLike, cacheDurationMs: number): CrawlCache {
  return {
    async shouldSkip(searchId) {
      const value = await redis.get(cacheKey(searchId));
      return value !== null;
    },

    async markCrawled(searchId) {
      await redis.set(cacheKey(searchId), Date.now().toString(), 'PX', cacheDurationMs);
    },
  };
}
