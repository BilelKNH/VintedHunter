import { describe, expect, it } from 'vitest';
import { ANALYZE_LISTING_QUEUE_NAME } from './queues.js';

describe('queue name constants', () => {
  it('exposes a stable analyze-listing queue name', () => {
    expect(ANALYZE_LISTING_QUEUE_NAME).toBe('analyze-listing');
  });
});
