import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/test/global-setup.ts",
    // Integration tests share one Postgres `test` schema (see test/build-test-app.ts) —
    // running files in parallel lets one file's afterEach cleanup wipe rows another file
    // is mid-test with, so files must run sequentially.
    fileParallelism: false,
  },
});
