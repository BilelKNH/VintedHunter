"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { PublicUser } from "@vinted-hunter/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useUpdateNotificationSettings } from "../../hooks/useNotificationSettings";
import { ApiError } from "../../services/api-client";

export function NotificationSettingsForm({ user }: { user: PublicUser }) {
  const [discordWebhook, setDiscordWebhook] = useState(user.discordWebhook ?? "");
  const [telegramBotToken, setTelegramBotToken] = useState(user.telegramBotToken ?? "");
  const [telegramChatId, setTelegramChatId] = useState(user.telegramChatId ?? "");
  const updateSettings = useUpdateNotificationSettings();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings.mutate(
      { discordWebhook, telegramBotToken, telegramChatId },
      {
        onSuccess: () => toast.success("Notification settings saved"),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="discordWebhook">Discord webhook URL</Label>
        <Input
          id="discordWebhook"
          type="url"
          placeholder="https://discord.com/api/webhooks/…"
          value={discordWebhook}
          onChange={(event) => setDiscordWebhook(event.target.value)}
        />
        <p className="text-xs text-text-tertiary">
          Server Settings → Integrations → Webhooks in the Discord channel you want alerts in.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telegramBotToken">Telegram bot token</Label>
          <Input
            id="telegramBotToken"
            placeholder="123456:ABC-DEF…"
            value={telegramBotToken}
            onChange={(event) => setTelegramBotToken(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telegramChatId">Telegram chat ID</Label>
          <Input
            id="telegramChatId"
            placeholder="123456789"
            value={telegramChatId}
            onChange={(event) => setTelegramChatId(event.target.value)}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-text-tertiary">
        Create a bot via @BotFather, then message it once and check
        api.telegram.org/bot&lt;token&gt;/getUpdates for your chat ID.
      </p>

      <p className="text-xs text-text-tertiary">
        Clear a field and save to remove that channel. At least one channel must be set to
        receive alerts for your best matches.
      </p>

      <Button type="submit" disabled={updateSettings.isPending} className="w-fit">
        {updateSettings.isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
