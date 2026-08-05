import { z } from "zod";

export const recordPurchaseSchema = z.object({
  listingId: z.string().uuid(),
  purchasePrice: z.number().positive(),
});
export type RecordPurchaseBody = z.infer<typeof recordPurchaseSchema>;

export const recordSaleSchema = z.object({
  sellingPrice: z.number().positive(),
});
export type RecordSaleBody = z.infer<typeof recordSaleSchema>;
