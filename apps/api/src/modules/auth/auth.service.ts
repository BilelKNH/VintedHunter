import type { User } from "@vinted-hunter/database";
import { REFRESH_TOKEN_TTL_DAYS } from "../../config/constants.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";
import type { UsersRepository } from "../users/users.repository.js";
import type { RefreshTokenRepository } from "./refresh-token.repository.js";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  email: string;
}

export interface AuthServiceDeps {
  usersRepository: UsersRepository;
  refreshTokenRepository: RefreshTokenRepository;
  hashPassword: (plain: string) => Promise<string>;
  verifyPassword: (plain: string, hash: string) => Promise<boolean>;
  generateRefreshToken: () => string;
  hashRefreshToken: (token: string) => string;
  signAccessToken: (payload: AccessTokenPayload) => string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstname?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

// Bcrypt hash of a fixed, unrelated string — used only to give the "email not found" path the
// same bcrypt.compare cost as the "wrong password" path, so response timing can't be used to
// enumerate registered emails (a real user's hash is never involved in this comparison).
const DUMMY_PASSWORD_HASH = "$2a$12$gd0n/0YeDMMlcvk3wz0w3O08.d58S4bA4ZPqPeTWvth3AX.tZABbu";

export function createAuthService(deps: AuthServiceDeps) {
  async function issueTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = deps.signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = deps.generateRefreshToken();
    const tokenHash = deps.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await deps.refreshTokenRepository.create({ userId: user.id, tokenHash, expiresAt });

    return { accessToken, refreshToken };
  }

  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      const existing = await deps.usersRepository.findByEmail(input.email);
      if (existing) {
        throw new ConflictError("Email already registered");
      }

      const password = await deps.hashPassword(input.password);
      const user = await deps.usersRepository.create({
        email: input.email,
        password,
        firstname: input.firstname,
      });

      const tokens = await issueTokens(user);
      return { user, ...tokens };
    },

    async login(input: LoginInput): Promise<AuthResult> {
      const user = await deps.usersRepository.findByEmail(input.email);
      // Always compare against a hash — a real one when the user exists, a fixed dummy one
      // otherwise — so this path costs the same whether or not the email is registered.
      const valid = await deps.verifyPassword(input.password, user?.password ?? DUMMY_PASSWORD_HASH);
      if (!user || !valid) {
        throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
      }

      const tokens = await issueTokens(user);
      return { user, ...tokens };
    },

    async refresh(rawRefreshToken: string): Promise<AuthResult> {
      const tokenHash = deps.hashRefreshToken(rawRefreshToken);
      const existing = await deps.refreshTokenRepository.findByHash(tokenHash);

      if (!existing) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      if (existing.revokedAt) {
        // A previously-rotated-out token was replayed — treat as a possible theft and
        // revoke every outstanding token for this user rather than just this one.
        await deps.refreshTokenRepository.revokeAllForUser(existing.userId);
        throw new UnauthorizedError("Invalid refresh token");
      }

      if (existing.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const user = await deps.usersRepository.findById(existing.userId);
      if (!user) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      await deps.refreshTokenRepository.revoke(existing.id);
      const tokens = await issueTokens(user);
      return { user, ...tokens };
    },

    async logout(rawRefreshToken: string): Promise<void> {
      const tokenHash = deps.hashRefreshToken(rawRefreshToken);
      const existing = await deps.refreshTokenRepository.findByHash(tokenHash);

      if (existing && !existing.revokedAt) {
        await deps.refreshTokenRepository.revoke(existing.id);
      }
    },
  };
}
