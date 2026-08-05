import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const validSource = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
};

describe('loadEnv', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = loadEnv(validSource);

    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(validSource.DATABASE_URL);
    expect(env.REDIS_URL).toBe(validSource.REDIS_URL);
  });

  it('throws a descriptive error when REDIS_URL is missing', () => {
    const { REDIS_URL: _omit, ...rest } = validSource;

    expect(() => loadEnv(rest)).toThrow(/REDIS_URL/);
  });
});
