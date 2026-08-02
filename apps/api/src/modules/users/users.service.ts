import type { User } from "@vinted-hunter/database";
import { NotFoundError } from "../../utils/errors.js";
import type { UsersRepository } from "./users.repository.js";

export interface UsersServiceDeps {
  usersRepository: UsersRepository;
}

export function createUsersService({ usersRepository }: UsersServiceDeps) {
  return {
    async getById(userId: string): Promise<User> {
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return user;
    },
  };
}
