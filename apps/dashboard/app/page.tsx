"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";

export default function RootPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base">
      <p className="font-display animate-pulse text-sm text-text-secondary">
        Booting up the hunt&hellip;
      </p>
    </main>
  );
}
