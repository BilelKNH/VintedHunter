import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Testing Library's auto-cleanup addon hooks into a global afterEach, which isn't available
// since this project uses explicit imports (globals: false) — register it manually so each
// test's render() doesn't leak into the next.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement ResizeObserver, which Radix Select (and other Radix primitives)
// use internally to measure elements — a no-op stub is sufficient for tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
