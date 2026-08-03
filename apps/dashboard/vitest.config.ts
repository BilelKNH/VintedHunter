import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json sets jsx:"preserve" for Next's own SWC pipeline — override here so Vite's
  // esbuild transform uses the modern automatic runtime instead of leaving JSX untransformed.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost:3000" },
    },
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
});
