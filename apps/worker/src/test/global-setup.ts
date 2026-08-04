import { execSync } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';

// Same isolated `test` Postgres schema apps/api's integration tests use (DATABASE_URL_TEST) —
// migrations are already applied by whichever test suite runs first in a given `pnpm test` /
// `turbo run test`, but applying them here too keeps `pnpm --filter worker test` runnable on
// its own.
export default function setup(): void {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL_TEST must be set to run integration tests');
  }

  const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../../..');

  execSync('pnpm --filter @vinted-hunter/database exec prisma migrate deploy', {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
