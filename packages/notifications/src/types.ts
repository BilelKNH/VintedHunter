export interface NotificationPayload {
  listingTitle: string;
  listingUrl: string;
  price: number;
  currency: string;
  estimatedValue: number;
  estimatedProfit: number;
  score: number;
  explanation: string[];
}

// Structurally matches a POST call through the global `fetch` (a real fetch-backed sender
// satisfies this without an adapter) — injected for testability, same pattern as
// packages/crawler's VintedHttpClient.
export interface HttpSender {
  post(url: string, body: unknown): Promise<{ ok: boolean; status: number }>;
}
