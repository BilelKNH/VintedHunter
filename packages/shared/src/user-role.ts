// Mirrors the Prisma UserRole enum (packages/database/prisma/schema.prisma) so consumers
// like the dashboard (Phase 3) don't need to depend on @prisma/client for this value.
export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
