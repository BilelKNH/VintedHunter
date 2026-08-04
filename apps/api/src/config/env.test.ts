import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const validSource = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-jwt-secret',
  COOKIE_SECRET: 'test-cookie-secret',
};

describe('loadEnv', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = loadEnv(validSource);

    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(env.DATABASE_URL).toBe(validSource.DATABASE_URL);
    expect(env.REDIS_URL).toBe(validSource.REDIS_URL);
  });

  it('coerces API_PORT from a string', () => {
    const env = loadEnv({ ...validSource, API_PORT: '4000' });

    expect(env.API_PORT).toBe(4000);
  });

  it('throws a descriptive error when a required variable is missing', () => {
    const { DATABASE_URL: _omit, ...rest } = validSource;

    expect(() => loadEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('throws a descriptive error when REDIS_URL is missing', () => {
    const { REDIS_URL: _omit, ...rest } = validSource;

    expect(() => loadEnv(rest)).toThrow(/REDIS_URL/);
  });
});
