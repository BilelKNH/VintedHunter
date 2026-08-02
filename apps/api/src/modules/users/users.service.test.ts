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
});
