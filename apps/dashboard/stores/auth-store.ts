import { create } from "zustand";
import type { PublicUser } from "@vinted-hunter/shared";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  accessToken: string | null;
  user: PublicUser | null;
  status: AuthStatus;
  setStatus(status: AuthStatus): void;
  setSession(session: { accessToken: string; user: PublicUser }): void;
  setAccessToken(token: string): void;
  clear(): void;
}

// Plain store, no `persist` middleware — accessToken lives in memory only for the tab's
// lifetime, matching that the API never gives the frontend a durable place to store it
// (only the httpOnly refresh cookie, which JS can't read or write).
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "idle",
  setStatus: (status) => set({ status }),
  setSession: ({ accessToken, user }) => set({ accessToken, user, status: "authenticated" }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));
