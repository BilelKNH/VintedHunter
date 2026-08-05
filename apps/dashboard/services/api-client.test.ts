import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiFetchPaginated, ApiError } from "./api-client";
import { useAuthStore } from "../stores/auth-store";

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const okEnvelope = (data: unknown) => ({ success: true, data, error: null });
const errEnvelope = (code: string, message: string) => ({
  success: false,
  data: null,
  error: { code, message },
});

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, status: "idle" });
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("attaches the Bearer header when a token exists", async () => {
    useAuthStore.getState().setAccessToken("token-abc");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, okEnvelope({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/searches");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-abc");
  });

  it("omits the Authorization header when no token exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, okEnvelope([])));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/listings");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("omits Content-Type on a bodyless request (e.g. DELETE)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(204, undefined));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/searches/1", { method: "DELETE" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("sets Content-Type when a body is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, okEnvelope({ id: "1" })));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/searches", { method: "POST", body: JSON.stringify({ name: "x" }) });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("unwraps the envelope and returns data on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, okEnvelope({ id: "1" })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/listings/1")).resolves.toEqual({ id: "1" });
  });

  it("apiFetchPaginated surfaces both items and meta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: [{ id: "1" }, { id: "2" }],
        error: null,
        meta: { total: 2, page: 1, limit: 20 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetchPaginated("/listings")).resolves.toEqual({
      items: [{ id: "1" }, { id: "2" }],
      meta: { total: 2, page: 1, limit: 20 },
    });
  });

  it("resolves without attempting to parse a body on 204 No Content", async () => {
    const jsonSpy = vi.fn(() => Promise.reject(new Error("should not be called on 204")));
    const fetchMock = vi.fn().mockResolvedValue({ status: 204, json: jsonSpy } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/searches/1")).resolves.toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("throws ApiError with code/message/status on success:false", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(404, errEnvelope("NOT_FOUND", "Listing not found")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/listings/missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Listing not found",
      status: 404,
    });
    await expect(apiFetch("/listings/missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("on a 401, refreshes once and retries the original request exactly once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, errEnvelope("UNAUTHORIZED", "expired")))
      .mockResolvedValueOnce(jsonResponse(200, okEnvelope({ accessToken: "new-token" })))
      .mockResolvedValueOnce(jsonResponse(200, okEnvelope([{ id: "s1" }])));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/searches");

    expect(result).toEqual([{ id: "s1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/auth/refresh");
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });

  it("de-dupes concurrent 401s into a single /auth/refresh call", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, errEnvelope("UNAUTHORIZED", "expired")))
      .mockResolvedValueOnce(jsonResponse(401, errEnvelope("UNAUTHORIZED", "expired")))
      .mockResolvedValueOnce(jsonResponse(200, okEnvelope({ accessToken: "new-token" })))
      .mockResolvedValueOnce(jsonResponse(200, okEnvelope({ a: 1 })))
      .mockResolvedValueOnce(jsonResponse(200, okEnvelope({ b: 2 })));
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([apiFetch("/a"), apiFetch("/b")]);

    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/auth/refresh"),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it("does not attempt a refresh when the failing request is itself under /auth/*", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, errEnvelope("UNAUTHORIZED", "bad credentials")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/auth/logout")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the auth store when the refresh itself fails, and propagates the error", async () => {
    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: {
        id: "u1",
        email: "j@example.com",
        firstname: null,
        role: "USER",
        discordWebhook: null,
        telegramBotToken: null,
        telegramChatId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, errEnvelope("UNAUTHORIZED", "expired")))
      .mockResolvedValueOnce(jsonResponse(401, errEnvelope("UNAUTHORIZED", "refresh invalid")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/searches")).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
