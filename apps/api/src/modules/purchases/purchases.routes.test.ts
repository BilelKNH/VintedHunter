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

describe("POST /purchases", () => {
  it("requires authentication", async () => {
    const listing = await createTestListing(testApp.prisma);

    const response = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      payload: { listingId: listing.id, purchasePrice: 35 },
    });

    expect(response.statusCode).toBe(401);
  });

  it("records a purchase, then rejects a second active purchase for the same listing", async () => {
    const token = await registerUser("buyer@example.com");
    const listing = await createTestListing(testApp.prisma, { price: 35 });

    const first = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing.id, purchasePrice: 35 },
    });
    expect(first.statusCode).toBe(201);
    const body = first.json().data;
    expect(body.status).toBe("PENDING");
    expect(body.purchasePrice).toBe(35);
    expect(body.listing.id).toBe(listing.id);

    const second = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing.id, purchasePrice: 35 },
    });
    expect(second.statusCode).toBe(409);
  });
});

describe("PATCH /purchases/:id/sell", () => {
  it("computes profit and marks the purchase sold", async () => {
    const token = await registerUser("seller@example.com");
    const listing = await createTestListing(testApp.prisma, { price: 35 });
    const created = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing.id, purchasePrice: 35 },
    });
    const purchaseId = created.json().data.id;

    const response = await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${purchaseId}/sell`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sellingPrice: 60 },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json().data;
    expect(body.status).toBe("SOLD");
    expect(body.sellingPrice).toBe(60);
    expect(body.profit).toBe(25);
  });

  it("prevents a user from selling another user's purchase", async () => {
    const tokenA = await registerUser("owner@example.com");
    const tokenB = await registerUser("intruder@example.com");
    const listing = await createTestListing(testApp.prisma);
    const created = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { listingId: listing.id, purchasePrice: 35 },
    });
    const purchaseId = created.json().data.id;

    const response = await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${purchaseId}/sell`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { sellingPrice: 60 },
    });

    expect(response.statusCode).toBe(403);
  });
});

describe("PATCH /purchases/:id/cancel", () => {
  it("cancels a pending purchase, freeing the listing for a new purchase", async () => {
    const token = await registerUser("canceller@example.com");
    const listing = await createTestListing(testApp.prisma);
    const created = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing.id, purchasePrice: 35 },
    });
    const purchaseId = created.json().data.id;

    const cancelResponse = await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${purchaseId}/cancel`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json().data.status).toBe("CANCELLED");

    const retryResponse = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing.id, purchasePrice: 40 },
    });
    expect(retryResponse.statusCode).toBe(201);
  });
});

describe("GET /purchases", () => {
  it("returns only the authenticated user's purchases, paginated", async () => {
    const tokenA = await registerUser("lister-a@example.com");
    const tokenB = await registerUser("lister-b@example.com");
    const listingA = await createTestListing(testApp.prisma, { title: "Bought by A" });
    const listingB = await createTestListing(testApp.prisma, { title: "Bought by B" });
    await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { listingId: listingA.id, purchasePrice: 35 },
    });
    await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { listingId: listingB.id, purchasePrice: 35 },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: "/purchases",
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].listing.title).toBe("Bought by A");
    expect(body.meta).toEqual({ total: 1, page: 1, limit: 20 });
  });
});

describe("GET /purchases/stats", () => {
  it("aggregates realized profit and average ROI across sold purchases", async () => {
    const token = await registerUser("stats@example.com");
    const listing1 = await createTestListing(testApp.prisma, { price: 35 });
    const listing2 = await createTestListing(testApp.prisma, { price: 20 });

    const p1 = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing1.id, purchasePrice: 40 },
    });
    await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${p1.json().data.id}/sell`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sellingPrice: 60 },
    });

    await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: listing2.id, purchasePrice: 20 },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: "/purchases/stats",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const stats = response.json().data;
    expect(stats.totalPurchased).toBe(2);
    expect(stats.totalSold).toBe(1);
    expect(stats.totalPending).toBe(1);
    expect(stats.totalInvested).toBe(60);
    expect(stats.totalRealizedProfit).toBe(20);
    expect(stats.averageRealizedRoi).toBe(50);
  });
});

describe("GET /purchases/by-listing/:listingId", () => {
  // One shared user across every scenario in this block (each against its own listing) to stay
  // under RATE_LIMIT_AUTH_MAX (10 registrations/min) — registerUser is otherwise the dominant
  // cost in this file.
  it("tracks a listing's purchase state through pending, sold, and cancelled", async () => {
    const token = await registerUser("lookup@example.com");

    // 1. Nothing recorded yet.
    const soldListing = await createTestListing(testApp.prisma, { price: 35 });
    const beforePurchase = await testApp.app.inject({
      method: "GET",
      url: `/purchases/by-listing/${soldListing.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(beforePurchase.statusCode).toBe(200);
    expect(beforePurchase.json().data).toBeNull();

    // 2. Recorded as purchased (PENDING) — shows up.
    const created = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: soldListing.id, purchasePrice: 35 },
    });
    const afterPurchase = await testApp.app.inject({
      method: "GET",
      url: `/purchases/by-listing/${soldListing.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(afterPurchase.statusCode).toBe(200);
    expect(afterPurchase.json().data.listingId).toBe(soldListing.id);

    // 3. Marked SOLD — regression check: findActiveByListingId used to only match PENDING,
    // so a sold purchase silently vanished from the listing detail page.
    await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${created.json().data.id}/sell`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sellingPrice: 60 },
    });
    const afterSale = await testApp.app.inject({
      method: "GET",
      url: `/purchases/by-listing/${soldListing.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(afterSale.statusCode).toBe(200);
    expect(afterSale.json().data.status).toBe("SOLD");
    expect(afterSale.json().data.profit).toBe(25);

    // 4. A separate listing, purchased then CANCELLED — reverts to null, as if never bought.
    const cancelledListing = await createTestListing(testApp.prisma);
    const cancelledPurchase = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: cancelledListing.id, purchasePrice: 20 },
    });
    await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${cancelledPurchase.json().data.id}/cancel`,
      headers: { authorization: `Bearer ${token}` },
    });
    const afterCancel = await testApp.app.inject({
      method: "GET",
      url: `/purchases/by-listing/${cancelledListing.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(afterCancel.statusCode).toBe(200);
    expect(afterCancel.json().data).toBeNull();
  });
});
