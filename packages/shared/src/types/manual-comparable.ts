// Mirrors the Prisma ManualComparable model as it's actually shaped over the wire — createdAt is
// an ISO string here (JSON has no Date type), not the Date object Prisma returns server-side.
export interface ManualComparable {
  id: string;
  userId: string;
  listingId: string;
  price: number;
  currency: string;
  sourceName: string;
  sourceUrl: string | null;
  note: string | null;
  createdAt: string;
}
