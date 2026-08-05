"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { NotificationSettingsForm } from "@/components/settings/NotificationSettingsForm";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">
          Configure where you get alerted about your best matches.
        </p>
      </div>

      {user ? (
        <div className="max-w-lg">
          <NotificationSettingsForm user={user} />
        </div>
      ) : (
        <Skeleton className="h-64 w-full max-w-lg" />
      )}
    </div>
  );
}
