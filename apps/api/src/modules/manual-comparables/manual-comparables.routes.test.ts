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

describe("POST /listings/:listingId/manual-comparables", () => {
  it("requires authentication", async () => {
    const listing = await createTestListing(testApp.prisma);

    const response = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      payload: { price: 74, sourceName: "eBay" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("records a manually-entered comparable price for a listing", async () => {
    const token = await registerUser("scout@example.com");
    const listing = await createTestListing(testApp.prisma);

    const response = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        price: 74,
        sourceName: "eBay",
        sourceUrl: "https://www.ebay.fr/itm/123",
        note: "Same colorway, sold last week",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json().data;
    expect(body.listingId).toBe(listing.id);
    expect(body.price).toBe(74);
    expect(body.currency).toBe("EUR");
    expect(body.sourceName).toBe("eBay");
    expect(body.sourceUrl).toBe("https://www.ebay.fr/itm/123");
  });

  it("rejects a non-positive price", async () => {
    const token = await registerUser("validator@example.com");
    const listing = await createTestListing(testApp.prisma);

    const response = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: -5, sourceName: "eBay" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /listings/:listingId/manual-comparables", () => {
  it("is public and lists comparables newest first", async () => {
    const token = await registerUser("lister@example.com");
    const listing = await createTestListing(testApp.prisma);
    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: 70, sourceName: "Depop" },
    });
    await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: 79, sourceName: "Vestiaire Collective" },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: `/listings/${listing.id}/manual-comparables`,
    });

    expect(response.statusCode).toBe(200);
    const items = response.json().data;
    expect(items).toHaveLength(2);
    expect(items[0].sourceName).toBe("Vestiaire Collective");
  });
});

describe("DELETE /manual-comparables/:id", () => {
  it("prevents a user from deleting another user's manual comparable", async () => {
    const owner = await registerUser("owner@example.com");
    const intruder = await registerUser("intruder@example.com");
    const listing = await createTestListing(testApp.prisma);
    const created = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${owner}` },
      payload: { price: 74, sourceName: "eBay" },
    });

    const response = await testApp.app.inject({
      method: "DELETE",
      url: `/manual-comparables/${created.json().data.id}`,
      headers: { authorization: `Bearer ${intruder}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deletes the owner's manual comparable", async () => {
    const token = await registerUser("deleter@example.com");
    const listing = await createTestListing(testApp.prisma);
    const created = await testApp.app.inject({
      method: "POST",
      url: `/listings/${listing.id}/manual-comparables`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: 74, sourceName: "eBay" },
    });

    const response = await testApp.app.inject({
      method: "DELETE",
      url: `/manual-comparables/${created.json().data.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(204);

    const listResponse = await testApp.app.inject({
      method: "GET",
      url: `/listings/${listing.id}/manual-comparables`,
    });
    expect(listResponse.json().data).toHaveLength(0);
  });

  it("returns 404 for a manual comparable that doesn't exist", async () => {
    const token = await registerUser("ghost@example.com");

    const response = await testApp.app.inject({
      method: "DELETE",
      url: "/manual-comparables/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
