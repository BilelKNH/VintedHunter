import Fastify from "fastify";
import { describe, expect, it } from "vitest";

function buildApp() {
  const app = Fastify();
  app.get("/health", async () => ({ status: "ok", service: "api" }));
  return app;
}

describe("GET /health", () => {
  it("returns ok status", async () => {
    const app = buildApp();

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "api" });
  });
});
