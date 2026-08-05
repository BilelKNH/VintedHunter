import type { Page } from 'playwright';
import type { VintedApiResponse, VintedHttpClient } from '@vinted-hunter/crawler';

interface PageFetchResult {
  status: number;
  ok: boolean;
  body: unknown;
}

// Runs the catalog request through the page's own fetch() instead of Playwright's
// out-of-band APIRequestContext. Vinted's Cloudflare bot-management challenges
// context.request calls (missing Sec-Fetch-*/Referer and other in-page signals) even
// though the same cookies are attached — an in-page fetch is indistinguishable from
// what Vinted's own frontend does when a visitor browses the catalog.
export function createPageFetchClient(page: Page): VintedHttpClient {
  return {
    async get(url, options): Promise<VintedApiResponse> {
      const params = options?.params ?? {};
      const query = new URLSearchParams(
        Object.entries(params).map(([key, value]): [string, string] => [key, String(value)]),
      ).toString();
      const fullUrl = query ? `${url}?${query}` : url;

      const result = await page.evaluate<PageFetchResult, string>(async (requestUrl) => {
        const response = await fetch(requestUrl, { headers: { accept: 'application/json' } });
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        return { status: response.status, ok: response.ok, body };
      }, fullUrl);

      return {
        ok: () => result.ok,
        status: () => result.status,
        json: async () => result.body,
      };
    },
  };
}
