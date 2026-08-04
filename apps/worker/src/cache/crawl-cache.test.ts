import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCrawlCache, type RedisLike } from './crawl-cache.js';

describe('createCrawlCache', () => {
  let redis: RedisLike;

  beforeEach(() => {
    redis = { get: vi.fn(), set: vi.fn() };
  });

  it('shouldSkip returns false when no cache entry exists', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const cache = createCrawlCache(redis, 1000);

    await expect(cache.shouldSkip('search-1')).resolves.toBe(false);
  });

  it('shouldSkip returns true when a cache entry exists', async () => {
    vi.mocked(redis.get).mockResolvedValue('1700000000000');
    const cache = createCrawlCache(redis, 1000);

    await expect(cache.shouldSkip('search-1')).resolves.toBe(true);
  });

  it('markCrawled sets a key scoped to the search with the configured TTL', async () => {
    const cache = createCrawlCache(redis, 86_400_000);

    await cache.markCrawled('search-1');

    expect(redis.set).toHaveBeenCalledWith(
      'crawler:last-crawled:search-1',
      expect.any(String),
      'PX',
      86_400_000,
    );
  });
});
