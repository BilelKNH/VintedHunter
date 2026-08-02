import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../../test/build-test-app.js";
import { cleanDatabase } from "../../test/db-cleanup.js";

let testApp: TestApp;

beforeAll(() => {
  testApp = buildTestApp();
});

afterEach(async () => {
  await cleanDatabase(testApp.prisma);
});

afterAll(async () => {
  await testApp.close();
});

async function registerUser(email: string): Promise<string> {
  const response = await testApp.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "correct-horse-battery" },
  });
  return response.json().data.accessToken as string;
}

const validSearch = {
  name: "Nike Tech Fleece",
  brands: ["Nike"],
  categories: ["Hoodie"],
  sizes: ["L"],
  keywords: [],
  excludedKeywords: [],
  maxPrice: 50,
  frequency: 15,
};

describe("/searches", () => {
  it("rejects requests without a token", async () => {
    const response = await testApp.app.inject({ method: "GET", url: "/searches" });

    expect(response.statusCode).toBe(401);
  });

  it("creates and lists searches scoped to the authenticated user", async () => {
    const token = await registerUser("owner@example.com");

    const createResponse = await testApp.app.inject({
      method: "POST",
      url: "/searches",
      headers: { authorization: `Bearer ${token}` },
      payload: validSearch,
    });
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().data.name).toBe("Nike Tech Fleece");

    const listResponse = await testApp.app.inject({
      method: "GET",
      url: "/searches",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data).toHaveLength(1);
  });

  it("prevents a user from updating or deleting another user's search", async () => {
    const ownerToken = await registerUser("owner2@example.com");
    const otherToken = await registerUser("intruder@example.com");

    const createResponse = await testApp.app.inject({
      method: "POST",
      url: "/searches",
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: validSearch,
    });
    const searchId = createResponse.json().data.id as string;

    const updateResponse = await testApp.app.inject({
      method: "PATCH",
      url: `/searches/${searchId}`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { name: "Hijacked" },
    });
    expect(updateResponse.statusCode).toBe(403);

    const deleteResponse = await testApp.app.inject({
      method: "DELETE",
      url: `/searches/${searchId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(deleteResponse.statusCode).toBe(403);
  });

  it("allows the owner to update and delete their own search", async () => {
    const token = await registerUser("owner3@example.com");

    const createResponse = await testApp.app.inject({
      method: "POST",
      url: "/searches",
      headers: { authorization: `Bearer ${token}` },
      payload: validSearch,
    });
    const searchId = createResponse.json().data.id as string;

    const updateResponse = await testApp.app.inject({
      method: "PATCH",
      url: `/searches/${searchId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Renamed" },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().data.name).toBe("Renamed");

    const deleteResponse = await testApp.app.inject({
      method: "DELETE",
      url: `/searches/${searchId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("returns 404 when updating a search that does not exist", async () => {
    const token = await registerUser("owner4@example.com");

    const response = await testApp.app.inject({
      method: "PATCH",
      url: "/searches/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Ghost" },
    });

    expect(response.statusCode).toBe(404);
  });
});
