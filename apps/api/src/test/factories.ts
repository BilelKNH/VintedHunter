import type { Listing, Marketplace, PrismaClient, Seller, User } from "@vinted-hunter/database";
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
    },
  });
}
