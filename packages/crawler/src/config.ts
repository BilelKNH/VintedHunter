import { z } from 'zod';
import type { CrawlerConfig } from './types.js';

// SPECIFICATION.md §11.7 writes cache duration as "24H" — support that literal format
// rather than asking operators to convert to milliseconds by hand.
const CACHE_DURATION_PATTERN = /^(\d+)H$/i;

function parseCacheDuration(value: string): number {
  const match = CACHE_DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid CACHE_DURATION "${value}" — expected a format like "24H"`);
  }
  return Number(match[1]) * 60 * 60 * 1000;
}

const envSchema = z.object({
  VINTED_BASE_URL: z.string().url().default('https://www.vinted.fr'),
  MAX_WORKERS: z.coerce.number().int().positive().default(5),
  REQUEST_DELAY_MIN: z.coerce.number().int().nonnegative().default(3000),
  REQUEST_DELAY_MAX: z.coerce.number().int().nonnegative().default(8000),
  CACHE_DURATION: z.string().default('24H'),
});

export function loadCrawlerConfig(source: NodeJS.ProcessEnv = process.env): CrawlerConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const invalid = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid crawler environment configuration — check: ${invalid}`);
  }

  const env = result.data;
  if (env.REQUEST_DELAY_MAX < env.REQUEST_DELAY_MIN) {
    throw new Error('REQUEST_DELAY_MAX must be greater than or equal to REQUEST_DELAY_MIN');
  }

  return {
    vintedBaseUrl: env.VINTED_BASE_URL,
    maxWorkers: env.MAX_WORKERS,
    requestDelayMinMs: env.REQUEST_DELAY_MIN,
    requestDelayMaxMs: env.REQUEST_DELAY_MAX,
    cacheDurationMs: parseCacheDuration(env.CACHE_DURATION),
  };
}
