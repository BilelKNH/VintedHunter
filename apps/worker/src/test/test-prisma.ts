import { PrismaClient } from '@vinted-hunter/database';

export function createTestPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL_TEST must be set to run integration tests');
  }
  return new PrismaClient({ datasourceUrl: databaseUrl });
}
