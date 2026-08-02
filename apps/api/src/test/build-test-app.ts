import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@vinted-hunter/database";
import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";

export interface TestApp {
  app: FastifyInstance;
  prisma: PrismaClient;
  close(): Promise<void>;
}

export function buildTestApp(): TestApp {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_TEST must be set to run integration tests");
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const env = loadEnv({ ...process.env, DATABASE_URL: databaseUrl });
  const app = buildApp({ env, prisma });

  return {
    app,
    prisma,
    async close() {
      await app.close();
    },
  };
}
