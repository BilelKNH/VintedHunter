import { describe, expect, it } from "vitest";
import { failure, success } from "./response.js";

describe("success", () => {
  it("wraps data with success envelope and no meta by default", () => {
    expect(success({ id: "1" })).toEqual({
      success: true,
      data: { id: "1" },
      error: null,
    });
  });

  it("includes meta when provided", () => {
    expect(success([1, 2], { total: 2, page: 1, limit: 10 })).toEqual({
      success: true,
      data: [1, 2],
      error: null,
      meta: { total: 2, page: 1, limit: 10 },
    });
  });
});

describe("failure", () => {
  it("wraps an error code and message with no details by default", () => {
    expect(failure("NOT_FOUND", "Search not found")).toEqual({
      success: false,
      data: null,
      error: { code: "NOT_FOUND", message: "Search not found" },
    });
  });

  it("includes details when provided", () => {
    expect(failure("VALIDATION_ERROR", "Invalid input", [{ path: "email" }])).toEqual({
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: [{ path: "email" }],
      },
    });
  });
});
