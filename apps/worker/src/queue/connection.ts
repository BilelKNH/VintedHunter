import { Redis } from 'ioredis';

// BullMQ requires `maxRetriesPerRequest: null` on the connection it's handed —
// https://docs.bullmq.io/guide/going-to-production#maxretriesperrequest
export function createRedisConnection(redisUrl: string): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}
