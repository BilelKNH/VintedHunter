import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";

export function createSecurityPlugin(corsOrigin: string) {
  return fp(async function securityPlugin(app: FastifyInstance) {
    await app.register(helmet, {
      // Without this, helmet's same-origin-by-default CORP header can block the dashboard's
      // cross-origin fetch() of JSON responses in some browsers.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });
    await app.register(cors, {
      origin: corsOrigin,
      credentials: true, // required so the refresh-token cookie is sent cross-origin
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });
  });
}
