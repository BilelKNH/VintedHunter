import { execSync } from "node:child_process";
import path from "node:path";
import url from "node:url";

// Applies all Prisma migrations to the isolated `test` Postgres schema (DATABASE_URL_TEST),
// once per test run, so integration tests hit real Postgres without touching dev data
// (which lives in the `public` schema of the same container).
export default function setup(): void {
  const databaseUrl = process.env.DATABASE_URL_TEST;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_TEST must be set to run integration tests");
  }

  const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../../../..");

  execSync("pnpm --filter @vinted-hunter/database exec prisma migrate deploy", {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}
