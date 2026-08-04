import { describe, expect, it, vi } from 'vitest';
import {
  createVintedClient,
  type VintedApiResponse,
  type VintedHttpClient,
} from './vinted-client.js';
import type { SearchConfiguration } from '../types.js';

const search: SearchConfiguration = {
  id: 'search-1',
  name: 'Nike Tech Fleece L',
  brands: ['Nike'],
  categories: [],
  sizes: [],
  keywords: [],
  excludedKeywords: [],
  minPrice: null,
  maxPrice: null,
};

function fakeResponse(body: unknown, ok = true, status = 200): VintedApiResponse {
  return { ok: () => ok, status: () => status, json: () => Promise.resolve(body) };
}

async function collect<T>(iterator: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const value of iterator) {
    results.push(value);
  }
  return results;
}

describe('createVintedClient.searchPages', () => {
  it('yields items and stops once hasNextPage is false', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        fakeResponse({ items: [{ id: 1 }], pagination: { current_page: 1, total_pages: 1 } }),
      );
    const http: VintedHttpClient = { get };
    const client = createVintedClient({
      http,
      config: {
        vintedBaseUrl: 'https://www.vinted.fr',
        requestDelayMinMs: 0,
        requestDelayMaxMs: 0,
      },
    });

    const pages = await collect(client.searchPages(search));

    expect(pages).toEqual([[{ id: 1 }]]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      'https://www.vinted.fr/api/v2/catalog/items',
      expect.objectContaining({ params: expect.objectContaining({ page: 1, per_page: 48 }) }),
    );
  });

  it('paginates while hasNextPage is true, waiting between pages', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(
        fakeResponse({ items: [{ id: 1 }], pagination: { current_page: 1, total_pages: 2 } }),
      )
      .mockResolvedValueOnce(
        fakeResponse({ items: [{ id: 2 }], pagination: { current_page: 2, total_pages: 2 } }),
      );
    const wait = vi.fn().mockResolvedValue(undefined);
    const client = createVintedClient({
      http: { get },
      config: {
        vintedBaseUrl: 'https://www.vinted.fr',
        requestDelayMinMs: 0,
        requestDelayMaxMs: 0,
      },
      rateLimiter: { wait },
    });

    const pages = await collect(client.searchPages(search));

    expect(pages).toEqual([[{ id: 1 }], [{ id: 2 }]]);
    expect(get).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it('stops at the maxPages cap even if hasNextPage stays true', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        fakeResponse({ items: [{ id: 1 }], pagination: { current_page: 1, total_pages: 99 } }),
      );
    const client = createVintedClient({
      http: { get },
      config: {
        vintedBaseUrl: 'https://www.vinted.fr',
        requestDelayMinMs: 0,
        requestDelayMaxMs: 0,
      },
      rateLimiter: { wait: vi.fn().mockResolvedValue(undefined) },
    });

    const pages = await collect(client.searchPages(search, { maxPages: 2 }));

    expect(pages).toHaveLength(2);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('throws when the response is not ok', async () => {
    const get = vi.fn().mockResolvedValue(fakeResponse({}, false, 429));
    const client = createVintedClient({
      http: { get },
      config: {
        vintedBaseUrl: 'https://www.vinted.fr',
        requestDelayMinMs: 0,
        requestDelayMaxMs: 0,
      },
    });

    await expect(collect(client.searchPages(search))).rejects.toThrow(/429/);
  });

  it('treats a missing pagination field as no next page', async () => {
    const get = vi.fn().mockResolvedValue(fakeResponse({ items: [{ id: 1 }] }));
    const client = createVintedClient({
      http: { get },
      config: {
        vintedBaseUrl: 'https://www.vinted.fr',
        requestDelayMinMs: 0,
        requestDelayMaxMs: 0,
      },
    });

    const pages = await collect(client.searchPages(search));

    expect(pages).toEqual([[{ id: 1 }]]);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
