import { describe, expect, it } from 'vitest';
import { createSearchSchema, updateSearchSchema } from './search.js';

function baseSearch(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'Nike Tech Fleece Hunter',
    frequency: 60,
    ...overrides,
  };
}

describe('createSearchSchema', () => {
  it('accepts a frequency at the 15-minute floor', () => {
    const result = createSearchSchema.safeParse(baseSearch({ frequency: 15 }));
    expect(result.success).toBe(true);
  });

  it('rejects a frequency below 15 minutes (the interval that triggered a Cloudflare block)', () => {
    const result = createSearchSchema.safeParse(baseSearch({ frequency: 1 }));
    expect(result.success).toBe(false);
  });
});

describe('updateSearchSchema', () => {
  it('still enforces the frequency floor when patching an existing search', () => {
    const result = updateSearchSchema.safeParse({ frequency: 5 });
    expect(result.success).toBe(false);
  });

  it('allows omitting frequency entirely on a partial update', () => {
    const result = updateSearchSchema.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });
});
