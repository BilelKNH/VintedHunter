import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export interface PlaywrightSession {
  context: BrowserContext;
  page: Page;
  close(): Promise<void>;
}

// Launches a real browser and visits the marketplace once so the context picks up session
// cookies, then hands back that same `page` for reuse (see ./page-fetch-client.ts, which drives
// the actual catalog JSON calls through the page's own fetch() rather than a side-channel
// APIRequestContext — Vinted's Cloudflare bot-management challenges the latter even with valid
// cookies attached). The page is kept open rather than closed after warm-up so it can keep
// making those in-page requests for the life of the session. Intentionally not unit-tested: it's
// a thin wrapper around a real browser, and the client logic it feeds is fully covered with a
// fake http client in packages/crawler.
export async function createPlaywrightSession(baseUrl: string): Promise<PlaywrightSession> {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: DESKTOP_USER_AGENT });

  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  return {
    context,
    page,
    async close() {
      await context.close();
      await browser.close();
    },
  };
}
