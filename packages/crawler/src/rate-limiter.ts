export interface RateLimiter {
  wait(): Promise<void>;
}

// Jittered delay between REQUEST_DELAY_MIN/MAX (§11.7). `wait()` calls are chained onto an
// internal queue rather than each starting an independent timer, so concurrent callers that
// share the same RateLimiter instance are serialized into one global pace — this matters
// because apps/worker constructs a single VintedClient (and therefore a single RateLimiter)
// for the whole process, shared across every concurrently-running crawl-search job. Without
// this, N concurrent jobs (Worker concurrency = MAX_WORKERS) would each pace their own
// requests independently, letting up to N requests fire at once regardless of the configured
// delay.
export function createRateLimiter(minMs: number, maxMs: number): RateLimiter {
  if (maxMs < minMs) {
    throw new Error('maxMs must be greater than or equal to minMs');
  }

  let queueTail: Promise<void> = Promise.resolve();

  return {
    wait(): Promise<void> {
      const delay = minMs + Math.random() * (maxMs - minMs);
      const turn = queueTail.then(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
          }),
      );
      queueTail = turn;
      return turn;
    },
  };
}
