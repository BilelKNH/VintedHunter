import { Redis } from 'ioredis';

// BullMQ requires `maxRetriesPerRequest: null` on the connection it's handed — same as
// apps/worker/src/queue/connection.ts (this is a producer-only connection, apps/api never
// consumes jobs, but the constraint still applies to any connection passed to a BullMQ Queue).
export function createRedisConnection(redisUrl: string): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}
