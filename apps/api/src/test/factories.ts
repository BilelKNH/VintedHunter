import type { Analysis, Listing, Marketplace, PrismaClient, Seller, User } from "@vinted-hunter/database";
import { hashPassword } from "../utils/password.js";

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{ email: string; password: string; firstname: string | null }> = {},
): Promise<User> {
  const password = overrides.password ?? "Test-Password-123!";
  return prisma.user.create({
    data: {
      email: overrides.email ?? `${unique("user")}@example.com`,
      password: await hashPassword(password),
      firstname: overrides.firstname ?? "Test",
    },
  });
}

export async function createTestSeller(
  prisma: PrismaClient,
  overrides: Partial<{ username: string; externalId: string }> = {},
): Promise<Seller> {
  return prisma.seller.create({
    data: {
      externalId: overrides.externalId ?? unique("seller-ext"),
      username: overrides.username ?? unique("seller"),
      rating: 4.8,
      reviews: 120,
    },
  });
}

export async function createTestListing(
  prisma: PrismaClient,
  overrides: Partial<{
    title: string;
    price: number;
    sellerId: string;
    source: Marketplace;
    brand: string;
    category: string;
    createdAt: Date;
  }> = {},
): Promise<Listing> {
  return prisma.listing.create({
    data: {
      externalId: unique("listing-ext"),
      source: overrides.source ?? "VINTED",
      title: overrides.title ?? "Nike Tech Fleece Hoodie",
      price: overrides.price ?? 35,
      currency: "EUR",
      url: "https://vinted.example/items/1",
      images: [],
      sellerId: overrides.sellerId,
      brand: overrides.brand,
      category: overrides.category,
      createdAt: overrides.createdAt,
    },
  });
}

// Deal Score v2's 7 sub-scores all default to a neutral 50 unless overridden — tests only need
// to set the field(s) the assertion actually cares about (score/estimatedProfit/roi/createdAt).
export async function createTestAnalysis(
  prisma: PrismaClient,
  listingId: string,
  overrides: Partial<{
    score: number;
    estimatedValue: number;
    estimatedProfit: number;
    roi: number;
    createdAt: Date;
  }> = {},
): Promise<Analysis> {
  return prisma.analysis.create({
    data: {
      listingId,
      score: overrides.score ?? 50,
      priceScore: 50,
      liquidityScore: 50,
      authenticityScore: 50,
      profitScore: 50,
      competitionScore: 50,
      trendScore: 50,
      seasonScore: 50,
      estimatedValue: overrides.estimatedValue ?? 100,
      estimatedValueLow: overrides.estimatedValue ?? 100,
      estimatedValueHigh: overrides.estimatedValue ?? 100,
      confidence: 50,
      estimatedProfit: overrides.estimatedProfit ?? 0,
      roi: overrides.roi ?? 0,
      maxBuyPrice: 0,
      explanation: [],
      createdAt: overrides.createdAt,
    },
  });
}
