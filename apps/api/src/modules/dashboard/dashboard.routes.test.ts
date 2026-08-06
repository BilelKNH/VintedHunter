import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../../test/build-test-app.js";
import { cleanDatabase } from "../../test/db-cleanup.js";
import { createTestAnalysis, createTestListing } from "../../test/factories.js";

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

describe("GET /dashboard/stats", () => {
  it("requires authentication", async () => {
    const response = await testApp.app.inject({ method: "GET", url: "/dashboard/stats" });

    expect(response.statusCode).toBe(401);
  });

  it("aggregates brand/category distribution, daily activity, averages, and success rate", async () => {
    const token = await registerUser("dashboard@example.com");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const strongNike = await createTestListing(testApp.prisma, {
      brand: "Nike",
      category: "Hoodie",
      createdAt: today,
    });
    await createTestAnalysis(testApp.prisma, strongNike.id, { score: 92, createdAt: today });

    const weakNike = await createTestListing(testApp.prisma, {
      brand: "Nike",
      category: "Hoodie",
      createdAt: yesterday,
    });
    await createTestAnalysis(testApp.prisma, weakNike.id, { score: 40, createdAt: yesterday });

    const adidasShoe = await createTestListing(testApp.prisma, {
      brand: "Adidas",
      category: "Shoes",
      createdAt: today,
    });
    await createTestAnalysis(testApp.prisma, adidasShoe.id, { score: 80, createdAt: today });

    // Unanalyzed listing — must not appear in category breakdown or daily activity.
    await createTestListing(testApp.prisma, { brand: "Puma", category: "Shoes" });

    const purchasable = await createTestListing(testApp.prisma, { price: 20 });
    const purchaseResponse = await testApp.app.inject({
      method: "POST",
      url: "/purchases",
      headers: { authorization: `Bearer ${token}` },
      payload: { listingId: purchasable.id, purchasePrice: 20 },
    });
    await testApp.app.inject({
      method: "PATCH",
      url: `/purchases/${purchaseResponse.json().data.id}/sell`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sellingPrice: 30 },
    });

    const response = await testApp.app.inject({
      method: "GET",
      url: "/dashboard/stats",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const stats = response.json().data;

    expect(stats.brandDistribution).toEqual(
      expect.arrayContaining([
        { brand: "Nike", count: 2 },
        { brand: "Adidas", count: 1 },
        { brand: "Puma", count: 1 },
      ]),
    );

    expect(stats.categoryBreakdown).toEqual(
      expect.arrayContaining([
        { category: "Hoodie", recommendation: "STRONG_BUY", count: 1 },
        { category: "Hoodie", recommendation: "IGNORE", count: 1 },
        { category: "Shoes", recommendation: "GOOD_OPPORTUNITY", count: 1 },
      ]),
    );
    // The unanalyzed Puma listing contributes no category-breakdown row.
    expect(
      stats.categoryBreakdown.some((row: { category: string }) => row.category === "Puma"),
    ).toBe(false);

    const todayKey = today.toISOString().slice(0, 10);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const todayBucket = stats.dailyActivity.find((day: { date: string }) => day.date === todayKey);
    const yesterdayBucket = stats.dailyActivity.find(
      (day: { date: string }) => day.date === yesterdayKey,
    );
    expect(todayBucket.count).toBe(2);
    expect(todayBucket.averageScore).toBe(86);
    expect(yesterdayBucket.count).toBe(1);
    expect(yesterdayBucket.averageScore).toBe(40);

    expect(stats.averages.totalAnalyzed).toBe(3);
    expect(stats.averages.averageScore).toBeCloseTo((92 + 40 + 80) / 3);

    expect(stats.successRate).toBe(100);
  });

  it("returns null successRate when the user has no sold purchases", async () => {
    const token = await registerUser("no-sales@example.com");

    const response = await testApp.app.inject({
      method: "GET",
      url: "/dashboard/stats",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.successRate).toBeNull();
  });
});
