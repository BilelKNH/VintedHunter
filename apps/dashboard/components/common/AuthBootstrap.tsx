"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../stores/auth-store";
import * as authService from "../../services/auth.service";

// Mounted once in providers.tsx. Silently exchanges the httpOnly refresh cookie (if valid)
// for a fresh access token on load, so the user doesn't have to log in again every visit.
export function AuthBootstrap() {
  const setStatus = useAuthStore((state) => state.setStatus);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      try {
        const { accessToken } = await authService.refresh();
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await authService.me();
        if (!cancelled) {
          setSession({ accessToken, user });
        }
      } catch {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setStatus, setSession]);

  return null;
}
