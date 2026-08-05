import { z } from 'zod';

// Crawler-specific vars (VINTED_BASE_URL, MAX_WORKERS, REQUEST_DELAY_MIN/MAX, CACHE_DURATION)
// are validated separately by @vinted-hunter/crawler's loadCrawlerConfig — no need to
// duplicate that schema here.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  // Vision AI (§13/§61/§62) — optional: analyze-listing.job.ts skips vision analysis entirely
  // when unset (same "feature degrades gracefully" pattern as the notification channels above).
  ANTHROPIC_API_KEY: z.string().optional(),
  VISION_MODEL: z.string().default('claude-haiku-4-5'),
  // Similarity engine (packages/similarity-engine) — same optional/degrade pattern: without a
  // key, analyze-listing.job.ts never computes an embedding and comparable-listings.repository
  // falls back to its pre-existing brand/category-only matching.
  OPENAI_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
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
