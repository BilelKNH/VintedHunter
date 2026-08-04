import type { FastifyInstance } from 'fastify';
import { vi } from 'vitest';
import { PrismaClient } from '@vinted-hunter/database';
import { buildApp } from '../app.js';
import { loadEnv } from '../config/env.js';
import type { AnalysisQueueProducer } from '../modules/analysis/analysis.service.js';

export interface TestApp {
  app: FastifyInstance;
  prisma: PrismaClient;
  // A fake queue producer (no real Redis needed for route-level integration tests) — exposed
  // so tests can assert a job was actually enqueued.
  analysisQueue: AnalysisQueueProducer;
  close(): Promise<void>;
}

export function buildTestApp(): TestApp {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL_TEST must be set to run integration tests');
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const env = loadEnv({ ...process.env, DATABASE_URL: databaseUrl });
  const analysisQueue: AnalysisQueueProducer = { add: vi.fn().mockResolvedValue(undefined) };
  const app = buildApp({ env, prisma, analysisQueue });

  return {
    app,
    prisma,
    analysisQueue,
    async close() {
      await app.close();
    },
  };
}
