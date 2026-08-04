import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './src/test/global-setup.ts',
    // Integration tests share one Postgres `test` schema — see apps/api/vitest.config.ts for
    // the same reasoning (parallel files would race each other's cleanup).
    fileParallelism: false,
  },
});
