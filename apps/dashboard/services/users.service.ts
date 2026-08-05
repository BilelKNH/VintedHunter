import type { PublicUser } from "@vinted-hunter/shared";
import { apiFetch } from "./api-client";

export interface NotificationSettingsInput {
  discordWebhook?: string | null;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
}

export function updateNotificationSettings(input: NotificationSettingsInput): Promise<PublicUser> {
  return apiFetch<PublicUser>("/users/me/notification-settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
