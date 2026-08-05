import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../../test/build-test-app.js";
import { cleanDatabase } from "../../test/db-cleanup.js";

let testApp: TestApp;

beforeAll(() => {
  testApp = buildTestApp();
});

afterEach(async () => {
  await cleanDatabase(testApp.prisma);
});

afterAll(async () => {
  await testApp.close();
});

async function registerUser(email: string): Promise<string> {
  const response = await testApp.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "correct-horse-battery" },
  });
  return response.json().data.accessToken as string;
}

describe("PATCH /users/me/notification-settings", () => {
  it("requires authentication", async () => {
    const response = await testApp.app.inject({
      method: "PATCH",
      url: "/users/me/notification-settings",
      payload: { discordWebhook: "https://discord.com/api/webhooks/x" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("saves notification channels and clears a field when sent an empty string", async () => {
    const token = await registerUser("settings@example.com");

    const saved = await testApp.app.inject({
      method: "PATCH",
      url: "/users/me/notification-settings",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        discordWebhook: "https://discord.com/api/webhooks/x",
        telegramBotToken: "bot-token",
        telegramChatId: "12345",
      },
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.json().data.discordWebhook).toBe("https://discord.com/api/webhooks/x");
    expect(saved.json().data.telegramBotToken).toBe("bot-token");

    const cleared = await testApp.app.inject({
      method: "PATCH",
      url: "/users/me/notification-settings",
      headers: { authorization: `Bearer ${token}` },
      payload: { discordWebhook: "" },
    });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json().data.discordWebhook).toBeNull();
    // Untouched fields survive a partial update.
    expect(cleared.json().data.telegramBotToken).toBe("bot-token");
  });
});
