import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "../config/constants.js";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
