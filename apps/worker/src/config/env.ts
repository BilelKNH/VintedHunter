import { z } from 'zod';

// Crawler-specific vars (VINTED_BASE_URL, MAX_WORKERS, REQUEST_DELAY_MIN/MAX, CACHE_DURATION)
// are validated separately by @vinted-hunter/crawler's loadCrawlerConfig — no need to
// duplicate that schema here.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  // Notification channels (§46-49) — optional: send-notification.job.ts skips any channel
  // whose config is empty rather than failing the job.
  DISCORD_WEBHOOK: z.string().optional(),
  TELEGRAM_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  // Vision AI (§13/§61/§62) — optional: analyze-listing.job.ts skips vision analysis entirely
  // when unset (same "feature degrades gracefully" pattern as the notification channels above).
  ANTHROPIC_API_KEY: z.string().optional(),
  VISION_MODEL: z.string().default('claude-haiku-4-5'),
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
