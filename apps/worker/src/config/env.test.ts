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

  it('leaves notification channel vars undefined when not set', () => {
    const env = loadEnv(validSource);

    expect(env.DISCORD_WEBHOOK).toBeUndefined();
    expect(env.TELEGRAM_TOKEN).toBeUndefined();
    expect(env.TELEGRAM_CHAT_ID).toBeUndefined();
  });

  it('parses notification channel vars when set', () => {
    const env = loadEnv({
      ...validSource,
      DISCORD_WEBHOOK: 'https://discord.example/webhook',
      TELEGRAM_TOKEN: 'bot-token',
      TELEGRAM_CHAT_ID: '12345',
    });

    expect(env.DISCORD_WEBHOOK).toBe('https://discord.example/webhook');
    expect(env.TELEGRAM_TOKEN).toBe('bot-token');
    expect(env.TELEGRAM_CHAT_ID).toBe('12345');
  });
});
