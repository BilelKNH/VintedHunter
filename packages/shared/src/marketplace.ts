// Mirrors the Prisma Marketplace enum (packages/database/prisma/schema.prisma) so consumers
// like the dashboard don't need to depend on @prisma/client for this value.
export const Marketplace = {
  VINTED: "VINTED",
} as const;

export type Marketplace = (typeof Marketplace)[keyof typeof Marketplace];
