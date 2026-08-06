import { z } from "zod";
import { paginationQuerySchema } from "./pagination.js";

// "newest" (default) is GET /listings' existing behavior, byte-identical. "score"/"profit" rank
// by the triggering Deal Score v2 sub-fields — see apps/api's listings.repository.ts, which
// excludes listings with no Analysis yet for either of those (nothing to rank them by).
export const listingsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["newest", "score", "profit"]).default("newest"),
});
export type ListingsQuery = z.infer<typeof listingsQuerySchema>;
