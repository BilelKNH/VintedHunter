"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth-store";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-lg font-semibold text-text-primary">
            Vinted <span className="text-accent-primary">Hunter</span>
          </span>
          <span className="text-xs text-text-tertiary">AI-powered resale opportunity console</span>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-surface p-6 shadow-xl shadow-black/20">
          {children}
        </div>
      </div>
    </main>
  );
}
