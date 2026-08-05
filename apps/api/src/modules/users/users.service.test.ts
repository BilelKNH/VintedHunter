import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@vinted-hunter/database";
import { createUsersService } from "./users.service.js";
import type { UsersRepository } from "./users.repository.js";
import { NotFoundError } from "../../utils/errors.js";

describe("users.service", () => {
  let usersRepository: UsersRepository;
  let service: ReturnType<typeof createUsersService>;

  beforeEach(() => {
    usersRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      updateNotificationSettings: vi.fn(),
    };
    service = createUsersService({ usersRepository });
  });

  it("returns the user when found", async () => {
    const user: User = {
      id: "user-1",
      email: "jane@example.com",
      password: "hash",
      firstname: "Jane",
      role: "USER",
      discordWebhook: null,
      telegramBotToken: null,
      telegramChatId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(usersRepository.findById).mockResolvedValue(user);

    await expect(service.getById("user-1")).resolves.toEqual(user);
  });

  it("throws NotFoundError when the user does not exist", async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(service.getById("missing")).rejects.toThrow(NotFoundError);
  });

  describe("updateNotificationSettings", () => {
    it("passes the update through to the repository and returns the updated user", async () => {
      const updated: User = {
        id: "user-1",
        email: "jane@example.com",
        password: "hash",
        firstname: "Jane",
        role: "USER",
        discordWebhook: "https://discord.com/api/webhooks/x",
        telegramBotToken: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(usersRepository.updateNotificationSettings).mockResolvedValue(updated);

      const result = await service.updateNotificationSettings("user-1", {
        discordWebhook: "https://discord.com/api/webhooks/x",
      });

      expect(usersRepository.updateNotificationSettings).toHaveBeenCalledWith("user-1", {
        discordWebhook: "https://discord.com/api/webhooks/x",
      });
      expect(result).toEqual(updated);
    });
  });
});
