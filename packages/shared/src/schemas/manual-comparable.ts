import { z } from "zod";

export const createManualComparableSchema = z.object({
  price: z.number().positive(),
  currency: z.string().length(3).optional(),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  note: z.string().optional(),
});
export type CreateManualComparableBody = z.infer<typeof createManualComparableSchema>;
