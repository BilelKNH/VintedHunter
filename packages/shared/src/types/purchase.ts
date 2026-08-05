// Mirrors the Prisma PurchaseStatus enum.
export type PurchaseStatus = "PENDING" | "SOLD" | "CANCELLED";

// Mirrors the Prisma Purchase model as shaped over the wire, with a denormalized listing summary
// so the Purchases page doesn't need a second round-trip per row (see types/listing.ts for the
// date-as-ISO-string note).
export interface Purchase {
  id: string;
  userId: string;
  listingId: string;
  purchasePrice: number;
  sellingPrice: number | null;
  profit: number | null;
  status: PurchaseStatus;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    url: string;
  };
}

// Aggregate profitability across every purchase a user has recorded — the "did this tool
// actually make me money" view surfaced on the main Dashboard.
export interface PurchaseStats {
  totalPurchased: number;
  totalSold: number;
  totalPending: number;
  totalInvested: number;
  totalRealizedProfit: number;
  // Percentage, matches @vinted-hunter/analyzer's roi convention (e.g. 150 means +150%). null
  // when nothing has been sold yet — there's no meaningful average to show.
  averageRealizedRoi: number | null;
}
