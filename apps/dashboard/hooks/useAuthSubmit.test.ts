import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuthSubmit } from "./useAuthSubmit";
import { useAuthStore } from "../stores/auth-store";
import { ApiError } from "../services/api-client";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const toastSuccessMock = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => toastSuccessMock(...args) },
}));

const fakeUser = {
  id: "user-1",
  email: "jane@example.com",
  firstname: "Jane",
  role: "USER" as const,
  discordWebhook: null,
  telegramBotToken: null,
  telegramChatId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, status: "idle" });
  pushMock.mockClear();
  toastSuccessMock.mockClear();
});

describe("useAuthSubmit", () => {
  it("stores the session, toasts the success message, and navigates to the dashboard", async () => {
    const { result } = renderHook(() => useAuthSubmit("Welcome back"));

    await act(async () => {
      await result.current.submit(async () => ({
        accessToken: "token-abc",
        user: fakeUser,
      }));
    });

    expect(useAuthStore.getState().accessToken).toBe("token-abc");
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(toastSuccessMock).toHaveBeenCalledWith("Welcome back");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("surfaces an ApiError's message and does not navigate", async () => {
    const { result } = renderHook(() => useAuthSubmit("Welcome back"));

    await act(async () => {
      await result.current.submit(async () => {
        throw new ApiError("UNAUTHORIZED", "Invalid credentials", 401);
      });
    });

    await waitFor(() => expect(result.current.error).toBe("Invalid credentials"));
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("idle");
  });

  it("falls back to a generic message for a non-ApiError failure", async () => {
    const { result } = renderHook(() => useAuthSubmit("Welcome back"));

    await act(async () => {
      await result.current.submit(async () => {
        throw new Error("network down");
      });
    });

    await waitFor(() => expect(result.current.error).toBe("Something went wrong"));
  });
});
