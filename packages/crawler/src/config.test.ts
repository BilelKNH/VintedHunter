import { describe, expect, it } from 'vitest';
import { loadCrawlerConfig } from './config.js';

describe('loadCrawlerConfig', () => {
  it('applies defaults when no env vars are set', () => {
    const config = loadCrawlerConfig({});

    expect(config).toEqual({
      vintedBaseUrl: 'https://www.vinted.fr',
      maxWorkers: 5,
      requestDelayMinMs: 3000,
      requestDelayMaxMs: 8000,
      cacheDurationMs: 24 * 60 * 60 * 1000,
    });
  });

  it('parses overrides from the environment', () => {
    const config = loadCrawlerConfig({
      VINTED_BASE_URL: 'https://www.vinted.de',
      MAX_WORKERS: '10',
      REQUEST_DELAY_MIN: '1000',
      REQUEST_DELAY_MAX: '2000',
      CACHE_DURATION: '6H',
    });

    expect(config.vintedBaseUrl).toBe('https://www.vinted.de');
    expect(config.maxWorkers).toBe(10);
    expect(config.requestDelayMinMs).toBe(1000);
    expect(config.requestDelayMaxMs).toBe(2000);
    expect(config.cacheDurationMs).toBe(6 * 60 * 60 * 1000);
  });

  it('throws when REQUEST_DELAY_MAX is smaller than REQUEST_DELAY_MIN', () => {
    expect(() =>
      loadCrawlerConfig({ REQUEST_DELAY_MIN: '9000', REQUEST_DELAY_MAX: '1000' }),
    ).toThrow(/REQUEST_DELAY_MAX/);
  });

  it('throws a descriptive error for a malformed CACHE_DURATION', () => {
    expect(() => loadCrawlerConfig({ CACHE_DURATION: '1day' })).toThrow(/CACHE_DURATION/);
  });

  it('throws when VINTED_BASE_URL is not a valid URL', () => {
    expect(() => loadCrawlerConfig({ VINTED_BASE_URL: 'not-a-url' })).toThrow(
      /Invalid crawler environment configuration/,
    );
  });
});
