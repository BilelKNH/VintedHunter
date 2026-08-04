import { createRateLimiter, type RateLimiter } from '../rate-limiter.js';
import type { CrawlerConfig, SearchConfiguration } from '../types.js';
import { buildVintedQuery } from './build-query.js';

// Structurally identical to Playwright's APIResponse (`ok()`, `status()`, `json()`) so a real
// `BrowserContext.request` satisfies this without an adapter — see apps/worker's playwright
// session bootstrap, which is what actually constructs the browser/session.
export interface VintedApiResponse {
  ok(): boolean;
  status(): number;
  json(): Promise<unknown>;
}

// Matches Playwright's `APIRequestContext.get(url, { params })` signature.
export interface VintedHttpClient {
  get(
    url: string,
    options?: { params?: Record<string, string | number> },
  ): Promise<VintedApiResponse>;
}

interface VintedCatalogResponse {
  items?: unknown[];
  pagination?: { current_page: number; total_pages: number };
}

export interface VintedClientDeps {
  http: VintedHttpClient;
  config: Pick<CrawlerConfig, 'vintedBaseUrl' | 'requestDelayMinMs' | 'requestDelayMaxMs'>;
  rateLimiter?: RateLimiter;
}

export interface VintedSearchOptions {
  maxPages?: number;
  perPage?: number;
}

export interface VintedClient {
  // Yields one page of raw Vinted item JSON at a time so callers (the crawl-search job) can
  // stop early once a page contains nothing new (§11.7 "éviter les appels inutiles") without
  // this client needing to know anything about the database.
  searchPages(
    search: SearchConfiguration,
    options?: VintedSearchOptions,
  ): AsyncGenerator<unknown[]>;
}

const DEFAULT_MAX_PAGES = 5;
const DEFAULT_PER_PAGE = 48;
const CATALOG_ITEMS_PATH = '/api/v2/catalog/items';

async function fetchPage(
  http: VintedHttpClient,
  baseUrl: string,
  query: ReturnType<typeof buildVintedQuery>,
): Promise<{ items: unknown[]; hasNextPage: boolean }> {
  const response = await http.get(`${baseUrl}${CATALOG_ITEMS_PATH}`, {
    params: { ...query },
  });

  if (!response.ok()) {
    throw new Error(`Vinted search request failed with status ${response.status()}`);
  }

  const body = (await response.json()) as VintedCatalogResponse;
  const items = body.items ?? [];
  const pagination = body.pagination;
  const hasNextPage = pagination != null && pagination.current_page < pagination.total_pages;

  return { items, hasNextPage };
}

export function createVintedClient(deps: VintedClientDeps): VintedClient {
  const limiter =
    deps.rateLimiter ??
    createRateLimiter(deps.config.requestDelayMinMs, deps.config.requestDelayMaxMs);

  return {
    async *searchPages(search, options = {}) {
      const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
      const perPage = options.perPage ?? DEFAULT_PER_PAGE;

      for (let page = 1; page <= maxPages; page += 1) {
        if (page > 1) {
          await limiter.wait();
        }

        const query = buildVintedQuery(search, page, perPage);
        const result = await fetchPage(deps.http, deps.config.vintedBaseUrl, query);

        yield result.items;

        if (!result.hasNextPage) {
          return;
        }
      }
    },
  };
}
