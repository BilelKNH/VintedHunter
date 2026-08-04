import { chromium, type Browser, type BrowserContext } from 'playwright';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export interface PlaywrightSession {
  context: BrowserContext;
  close(): Promise<void>;
}

// Launches a real browser and visits the marketplace once so the context picks up session
// cookies, then hands back `context.request` — an APIRequestContext that reuses those cookies
// for the actual catalog JSON calls (see @vinted-hunter/crawler's VintedClient, which only
// depends on the structural shape of that object, not on Playwright itself). Intentionally not
// unit-tested: it's a thin wrapper around a real browser, and the client logic it feeds is
// fully covered with a fake http client in packages/crawler.
export async function createPlaywrightSession(baseUrl: string): Promise<PlaywrightSession> {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: DESKTOP_USER_AGENT });

  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.close();

  return {
    context,
    async close() {
      await context.close();
      await browser.close();
    },
  };
}
