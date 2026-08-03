import type { UserRole } from "../user-role.js";

// Mirrors the Prisma User model minus `password`, as returned by /auth/register, /auth/login,
// and /auth/me (see types/listing.ts for the date-as-ISO-string note).
export interface PublicUser {
  id: string;
  email: string;
  firstname: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
