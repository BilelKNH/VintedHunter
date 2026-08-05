import { z } from "zod";

// Empty string clears the field (stored as null) — lets the dashboard's settings form submit a
// blanked-out input without a separate "remove" action.
const optionalChannelValue = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

export const updateNotificationSettingsSchema = z.object({
  discordWebhook: optionalChannelValue,
  telegramBotToken: optionalChannelValue,
  telegramChatId: optionalChannelValue,
});
export type UpdateNotificationSettingsBody = z.infer<typeof updateNotificationSettingsSchema>;
