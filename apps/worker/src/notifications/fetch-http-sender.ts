import type { HttpSender } from '@vinted-hunter/notifications';

// Thin wrapper around the global fetch — intentionally untested, same reasoning as
// browser/playwright-session.ts (a real network call with no logic of its own to unit-test;
// everything that consumes this interface is fully tested with a fake HttpSender).
export const fetchHttpSender: HttpSender = {
  async post(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: response.ok, status: response.status };
  },
};
