import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../../test/build-test-app.js";
import { cleanDatabase } from "../../test/db-cleanup.js";
import { createTestListing } from "../../test/factories.js";

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

describe("GET /listings", () => {
  it("returns paginated listings with meta", async () => {
    await createTestListing(testApp.prisma, { title: "Listing A" });
    await createTestListing(testApp.prisma, { title: "Listing B" });

    const response = await testApp.app.inject({ method: "GET", url: "/listings?page=1&limit=1" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({ total: 2, page: 1, limit: 1 });
  });

  it("does not require authentication", async () => {
    const response = await testApp.app.inject({ method: "GET", url: "/listings" });

    expect(response.statusCode).toBe(200);
  });
});

describe("GET /listings/:id", () => {
  it("returns 404 for a listing that does not exist", async () => {
    const response = await testApp.app.inject({
      method: "GET",
      url: "/listings/00000000-0000-0000-0000-000000000000",
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /listings/favorites", () => {
  it("requires authentication", async () => {
    const response = await testApp.app.inject({ method: "GET", url: "/listings/favorites" });

    expect(response.statusCode).toBe(401);
  });

  it("returns only the authenticated user's favorited listings, paginated", async () => {
    const tokenA = await registerUser("fan-a@example.com");
    const tokenB = await registerUser("fan-b@example.com");
    const listingA = await createTestListing(testApp.prisma, { title: "Favorited by A" });
    const listingB = await createTestListing(testApp.prisma, { title: "Favorited by B" });

    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listingA.id}/favorite`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listingB.id}/favorite`,
      headers: { authorization: `Bearer ${tokenB}` },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: "/listings/favorites",
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(listingA.id);
    expect(body.meta).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it("no longer includes an unfavorited listing", async () => {
    const token = await registerUser("fan-c@example.com");
    const listing = await createTestListing(testApp.prisma);

    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/favorite`,
      headers: { authorization: `Bearer ${token}` },
    });
    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/favorite`,
      headers: { authorization: `Bearer ${token}` },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: "/listings/favorites",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.json().data).toHaveLength(0);
  });
});

describe("POST /listings/:id/favorite", () => {
  it("requires authentication", async () => {
    const listing = await createTestListing(testApp.prisma);

    const response = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/favorite`,
    });

    expect(response.statusCode).toBe(401);
  });

  it("toggles favorited state on and off", async () => {
    const token = await registerUser("fan@example.com");
    const listing = await createTestListing(testApp.prisma);

    const first = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/favorite`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().data).toEqual({ favorited: true });

    const second = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/favorite`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().data).toEqual({ favorited: false });
  });
});
