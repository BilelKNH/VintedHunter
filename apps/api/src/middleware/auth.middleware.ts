import type { FastifyRequest } from "fastify";
import type { AccessTokenPayload } from "../modules/auth/auth.service.js";
import { UnauthorizedError } from "../utils/errors.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

// Best-effort JWT decode so rate-limiting/logging can key by user id when a valid token is
// present, without making authentication mandatory for the request to proceed.
export async function identifyUser(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    // no-op — absence of a valid token is fine here, requireAuth is the actual gate
  }
}

export async function requireAuth(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError("Authentication required");
  }
}
