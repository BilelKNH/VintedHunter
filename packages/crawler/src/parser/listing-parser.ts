import { z } from 'zod';

// Only the fields we actually use from Vinted's catalog item JSON — validated at the boundary
// since this is untrusted external data (coding-style.md). Malformed items are skipped rather
// than failing the whole crawl.
const rawVintedItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  url: z.string(),
  price: z
    .object({ amount: z.union([z.string(), z.number()]), currency_code: z.string() })
    .optional(),
  total_item_price: z
    .object({ amount: z.union([z.string(), z.number()]), currency_code: z.string() })
    .optional(),
  brand_title: z.string().nullable().optional(),
  size_title: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  photos: z.array(z.object({ url: z.string() })).optional(),
  user: z
    .object({
      id: z.union([z.number(), z.string()]),
      login: z.string(),
      feedback_reputation: z.number().nullable().optional(),
      feedback_count: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at_ts: z.union([z.number(), z.string()]).nullable().optional(),
});

export interface ParsedSeller {
  externalId: string;
  username: string;
  rating: number | null;
  reviews: number | null;
}

export interface ParsedListing {
  externalId: string;
  title: string;
  brand: string | null;
  size: string | null;
  condition: string | null;
  price: number;
  currency: string;
  url: string;
  images: string[];
  seller: ParsedSeller | null;
  publishedAt: string | null;
}

// Vinted's catalog/search endpoint doesn't return the item description (only the detail page
// does) — fetching per-item detail pages is out of scope for V1's catalog-only crawl, so
// description stays null here (the Listing.description column is already nullable).
export function parseListing(raw: unknown): ParsedListing | null {
  const result = rawVintedItemSchema.safeParse(raw);
  if (!result.success) {
    return null;
  }

  const item = result.data;
  const priceField = item.total_item_price ?? item.price;
  if (!priceField) {
    return null;
  }

  const price = Number(priceField.amount);
  if (!Number.isFinite(price)) {
    return null;
  }

  return {
    externalId: String(item.id),
    title: item.title,
    brand: item.brand_title ?? null,
    size: item.size_title ?? null,
    condition: item.status ?? null,
    price,
    currency: priceField.currency_code,
    url: item.url,
    images: (item.photos ?? []).map((photo) => photo.url),
    seller: item.user
      ? {
          externalId: String(item.user.id),
          username: item.user.login,
          rating: item.user.feedback_reputation ?? null,
          reviews: item.user.feedback_count ?? null,
        }
      : null,
    publishedAt: item.created_at_ts
      ? new Date(Number(item.created_at_ts) * 1000).toISOString()
      : null,
  };
}
