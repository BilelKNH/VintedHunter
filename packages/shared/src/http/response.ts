export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
  meta?: { total: number; page: number; limit: number };
}

export interface ApiErrorBody {
  success: false;
  data: null;
  error: { code: string; message: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export function success<T>(data: T, meta?: ApiSuccess<T>["meta"]): ApiSuccess<T> {
  return { success: true, data, error: null, ...(meta ? { meta } : {}) };
}

export function failure(code: string, message: string, details?: unknown): ApiErrorBody {
  return {
    success: false,
    data: null,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}
