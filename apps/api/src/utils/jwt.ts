import { createHash, randomBytes } from "node:crypto";

// Refresh tokens are opaque, high-entropy random values — not low-entropy passwords — so a
// fast deterministic digest (not bcrypt) is appropriate here: it still keeps the raw token
// out of the database, but supports an equality lookup by re-hashing the presented token,
// which bcrypt's random per-call salt would not allow.
export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
