import type { User } from "@vinted-hunter/database";

export function toPublicUser(user: User): Omit<User, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}
