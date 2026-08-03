import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load the monorepo root .env for DATABASE_URL_TEST etc. — Playwright doesn't read .env
// files itself, and this must happen before the webServer env blocks below are evaluated.
loadEnv({ path: "../.env" });

const API_PORT = 3001;
const DASHBOARD_PORT = 3000;
const DATABASE_URL_TEST = process.env.DATABASE_URL_TEST ?? "";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${DASHBOARD_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter api dev",
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      cwd: "../",
      // dotenv (used by `pnpm --filter api dev`) does not override already-set env vars, so
      // this DATABASE_URL wins over the one in .env — the E2E API instance runs against the
      // isolated test schema, never the dev database.
      env: { DATABASE_URL: DATABASE_URL_TEST },
      timeout: 60_000,
    },
    {
      command: "pnpm --filter dashboard dev",
      url: `http://localhost:${DASHBOARD_PORT}`,
      reuseExistingServer: !process.env.CI,
      cwd: "../",
      timeout: 60_000,
    },
  ],
});
