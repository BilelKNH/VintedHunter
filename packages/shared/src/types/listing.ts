import type { Marketplace } from "../marketplace.js";

// Mirrors the Prisma Listing model as it's actually shaped over the wire — date fields are
// ISO strings here (JSON has no Date type), not the Date objects Prisma returns server-side.
export interface Listing {
  id: string;
  externalId: string;
  source: Marketplace;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  price: number;
  currency: string;
  url: string;
  images: string[];
  sellerId: string | null;
  publishedAt: string | null;
  createdAt: string;
}
