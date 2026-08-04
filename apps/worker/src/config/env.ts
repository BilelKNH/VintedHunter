import { z } from 'zod';

// Crawler-specific vars (VINTED_BASE_URL, MAX_WORKERS, REQUEST_DELAY_MIN/MAX, CACHE_DURATION)
// are validated separately by @vinted-hunter/crawler's loadCrawlerConfig — no need to
// duplicate that schema here.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration — check: ${missing}`);
  }

  return result.data;
}
