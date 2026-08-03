"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth-store";
import { AppSidebar } from "../../components/layout/AppSidebar";
import { AppTopbar } from "../../components/layout/AppTopbar";
import { useFavoriteListings } from "../../hooks/useFavorites";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  // Hydrates favorites-store on every authenticated page load — not just /dashboard — so a
  // listing's favorited state renders correctly right after a reload on any page.
  useFavoriteListings(1, 100);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg-base">
        <p className="font-display animate-pulse text-sm text-text-secondary">
          Booting up the hunt&hellip;
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh bg-bg-base">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
