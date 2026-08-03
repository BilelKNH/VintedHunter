import { execSync } from "node:child_process";
import path from "node:path";
import url from "node:url";

// Mirrors apps/api/src/test/global-setup.ts — applies migrations and seeds a few listings
// against the isolated `test` Postgres schema (DATABASE_URL_TEST) so the golden-path spec has
// something real to browse/favorite, without touching dev data in the `public` schema.
export default function globalSetup(): void {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_TEST must be set to run E2E tests");
  }

  const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../..");
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  execSync("pnpm --filter @vinted-hunter/database exec prisma migrate deploy", {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });

  execSync("pnpm --filter @vinted-hunter/database exec tsx prisma/seed.ts", {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
}
