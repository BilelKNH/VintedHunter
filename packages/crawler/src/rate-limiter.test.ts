import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from './rate-limiter.js';

describe('createRateLimiter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('throws when maxMs is smaller than minMs', () => {
    expect(() => createRateLimiter(8000, 3000)).toThrow(/maxMs must be greater/);
  });

  it('waits at least minMs', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const limiter = createRateLimiter(3000, 8000);

    const resolved = vi.fn();
    limiter.wait().then(resolved);

    await vi.advanceTimersByTimeAsync(2999);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
  });

  it('waits at most maxMs', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const limiter = createRateLimiter(3000, 8000);

    const resolved = vi.fn();
    limiter.wait().then(resolved);

    await vi.advanceTimersByTimeAsync(8000);
    expect(resolved).toHaveBeenCalled();
  });

  it('serializes concurrent callers instead of letting their delays overlap', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // pins every delay to exactly minMs
    const limiter = createRateLimiter(1000, 1000);

    const firstResolved = vi.fn();
    const secondResolved = vi.fn();
    limiter.wait().then(firstResolved);
    limiter.wait().then(secondResolved);

    // If the two calls ran independent timers, both would resolve here (1000ms each, started
    // together). Serialized, only the first has resolved — the second's delay only starts
    // once the first's turn completes.
    await vi.advanceTimersByTimeAsync(1000);
    expect(firstResolved).toHaveBeenCalled();
    expect(secondResolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(secondResolved).toHaveBeenCalled();
  });
});
