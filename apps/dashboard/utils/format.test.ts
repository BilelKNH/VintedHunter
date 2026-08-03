import { describe, expect, it, vi } from "vitest";
import { formatPrice, formatRelativeDate } from "./format";

describe("formatPrice", () => {
  it("formats a price with the given currency", () => {
    expect(formatPrice(35, "EUR")).toBe("€35.00");
  });

  it("formats zero correctly", () => {
    expect(formatPrice(0, "EUR")).toBe("€0.00");
  });

  it("falls back to a plain string for an invalid currency code", () => {
    expect(formatPrice(10, "NOT_A_CURRENCY")).toBe("10 NOT_A_CURRENCY");
  });
});

describe("formatRelativeDate", () => {
  it("returns 'Unknown date' for null", () => {
    expect(formatRelativeDate(null)).toBe("Unknown date");
  });

  it("returns 'just now' for a timestamp seconds ago", () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe("just now");
  });

  it("formats minutes ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(formatRelativeDate("2026-01-01T11:55:00.000Z")).toBe("5m ago");
    vi.useRealTimers();
  });

  it("formats hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    expect(formatRelativeDate("2026-01-01T09:00:00.000Z")).toBe("3h ago");
    vi.useRealTimers();
  });

  it("formats days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T12:00:00.000Z"));
    expect(formatRelativeDate("2026-01-01T12:00:00.000Z")).toBe("4d ago");
    vi.useRealTimers();
  });
});
