import type { ApiResponse, ApiSuccess } from "@vinted-hunter/shared";
import { useAuthStore } from "../stores/auth-store";
import { API_BASE_URL } from "../utils/constants";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

async function parseEnvelope<T>(res: Response): Promise<ApiSuccess<T>> {
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message, res.status, body.error.details);
  }
  return body;
}

function unwrapEnvelope<T>(res: Response): Promise<T> {
  // 204 No Content (e.g. DELETE /searches/:id) has no body to parse.
  if (res.status === 204) {
    return Promise.resolve(undefined as T);
  }
  return parseEnvelope<T>(res).then((body) => body.data);
}

async function unwrapPaginatedEnvelope<T>(res: Response): Promise<PaginatedResult<T>> {
  const body = await parseEnvelope<T[]>(res);
  return { items: body.data, meta: body.meta ?? { total: body.data.length, page: 1, limit: body.data.length } };
}

// De-dupes concurrent 401s into a single /auth/refresh call instead of racing multiple.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => unwrapEnvelope<{ accessToken: string }>(res))
      .then(({ accessToken }) => {
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .catch((error: unknown) => {
        useAuthStore.getState().clear();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function rawFetch(path: string, init: RequestInit, isRetry: boolean): Promise<Response> {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      // Only send Content-Type on requests that actually have a body — Fastify's JSON body
      // parser rejects an empty body when this header is set (DELETE, /auth/refresh,
      // /auth/logout all send no body).
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // Never recurse on /auth/* itself — a 401 from /auth/refresh means the refresh cookie is
  // gone/invalid, not something a retry could fix.
  if (res.status === 401 && !isRetry && !path.startsWith("/auth/")) {
    await refreshAccessToken();
    return rawFetch(path, init, true);
  }

  return res;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await rawFetch(path, init, false);
  return unwrapEnvelope<T>(res);
}

export async function apiFetchPaginated<T>(
  path: string,
  init: RequestInit = {},
): Promise<PaginatedResult<T>> {
  const res = await rawFetch(path, init, false);
  return unwrapPaginatedEnvelope<T>(res);
}
