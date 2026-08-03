import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./auth-store";

const fakeUser = {
  id: "user-1",
  email: "jane@example.com",
  firstname: "Jane",
  role: "USER" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, status: "idle" });
});

describe("auth-store", () => {
  it("starts idle with no session", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("idle");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setSession stores the token/user and marks authenticated", () => {
    useAuthStore.getState().setSession({ accessToken: "token-abc", user: fakeUser });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("token-abc");
    expect(state.user).toEqual(fakeUser);
    expect(state.status).toBe("authenticated");
  });

  it("setAccessToken updates only the token", () => {
    useAuthStore.getState().setSession({ accessToken: "token-abc", user: fakeUser });
    useAuthStore.getState().setAccessToken("token-rotated");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("token-rotated");
    expect(state.user).toEqual(fakeUser);
  });

  it("clear resets the session and marks unauthenticated", () => {
    useAuthStore.getState().setSession({ accessToken: "token-abc", user: fakeUser });
    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe("unauthenticated");
  });

  it("never writes the access token to localStorage or sessionStorage", () => {
    // Spy on Storage.prototype.setItem (shared by both localStorage and sessionStorage in
    // jsdom) rather than reading storage back — robust regardless of the storage backend's
    // own quirks, and directly proves the memory-only invariant: nothing ever calls setItem.
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    useAuthStore.getState().setSession({ accessToken: "super-secret-token", user: fakeUser });
    useAuthStore.getState().setAccessToken("rotated-secret-token");
    useAuthStore.getState().clear();

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
