import { describe, expect, it } from "vitest";
import { generateRefreshToken, hashRefreshToken } from "./jwt.js";

describe("generateRefreshToken", () => {
  it("generates a high-entropy hex string", () => {
    const token = generateRefreshToken();

    expect(token).toMatch(/^[0-9a-f]{96}$/);
  });

  it("generates a different token each call", () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe("hashRefreshToken", () => {
  it("is deterministic for the same input", () => {
    const token = generateRefreshToken();

    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashRefreshToken(generateRefreshToken())).not.toBe(
      hashRefreshToken(generateRefreshToken()),
    );
  });
});
