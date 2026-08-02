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

function extractRefreshCookie(setCookieHeader: string | string[] | undefined): string {
  const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  if (!raw) throw new Error("Expected a Set-Cookie header");
  return raw;
}

describe("POST /auth/register", () => {
  it("creates a user and returns an access token + refresh cookie", async () => {
    const response = await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "jane@example.com", password: "correct-horse-battery" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe("jane@example.com");
    expect(body.data.user.password).toBeUndefined();
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(response.cookies.some((cookie) => cookie.name === "refreshToken")).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "dup@example.com", password: "correct-horse-battery" },
    });

    const response = await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "dup@example.com", password: "correct-horse-battery" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("CONFLICT");
  });

  it("rejects an invalid payload with 400", async () => {
    const response = await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "not-an-email", password: "short" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().success).toBe(false);
  });
});

describe("auth flow", () => {
  it("logs in, accesses a protected route, refreshes, and logs out", async () => {
    await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "flow@example.com", password: "correct-horse-battery" },
    });

    const loginResponse = await testApp.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "flow@example.com", password: "correct-horse-battery" },
    });
    expect(loginResponse.statusCode).toBe(200);
    const { accessToken } = loginResponse.json().data;
    const refreshCookie = extractRefreshCookie(loginResponse.headers["set-cookie"]);

    const meResponse = await testApp.app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json().data.email).toBe("flow@example.com");

    const refreshResponse = await testApp.app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(refreshResponse.statusCode).toBe(200);
    const rotatedCookie = extractRefreshCookie(refreshResponse.headers["set-cookie"]);

    const logoutResponse = await testApp.app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: {
        authorization: `Bearer ${refreshResponse.json().data.accessToken}`,
        cookie: rotatedCookie,
      },
    });
    expect(logoutResponse.statusCode).toBe(200);

    const replayResponse = await testApp.app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: { cookie: rotatedCookie },
    });
    expect(replayResponse.statusCode).toBe(401);
  });

  it("returns 401 for /auth/me without a token", async () => {
    const response = await testApp.app.inject({ method: "GET", url: "/auth/me" });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for login with wrong password", async () => {
    await testApp.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "wrongpass@example.com", password: "correct-horse-battery" },
    });

    const response = await testApp.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "wrongpass@example.com", password: "not-the-password" },
    });

    expect(response.statusCode).toBe(401);
  });
});
