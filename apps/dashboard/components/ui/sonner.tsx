"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      toastOptions={{
        style: {
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
        },
      }}
    />
  );
}
