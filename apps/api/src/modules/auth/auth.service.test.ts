import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@vinted-hunter/database";
import { createAuthService } from "./auth.service.js";
import type { UsersRepository } from "../users/users.repository.js";
import type { RefreshTokenRepository } from "./refresh-token.repository.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "jane@example.com",
    password: "hashed-password",
    firstname: "Jane",
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("auth.service", () => {
  let usersRepository: UsersRepository;
  let refreshTokenRepository: RefreshTokenRepository;
  let hashPassword: ReturnType<typeof vi.fn>;
  let verifyPassword: ReturnType<typeof vi.fn>;
  let generateRefreshToken: ReturnType<typeof vi.fn>;
  let hashRefreshToken: ReturnType<typeof vi.fn>;
  let signAccessToken: ReturnType<typeof vi.fn>;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    usersRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    refreshTokenRepository = {
      create: vi.fn(),
      findByHash: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
    };
    hashPassword = vi.fn().mockResolvedValue("hashed-password");
    verifyPassword = vi.fn().mockResolvedValue(true);
    generateRefreshToken = vi.fn().mockReturnValue("raw-refresh-token");
    hashRefreshToken = vi.fn().mockReturnValue("hashed-refresh-token");
    signAccessToken = vi.fn().mockReturnValue("signed-access-token");

    service = createAuthService({
      usersRepository,
      refreshTokenRepository,
      hashPassword,
      verifyPassword,
      generateRefreshToken,
      hashRefreshToken,
      signAccessToken,
    });
  });

  describe("register", () => {
    it("creates a new user and issues tokens", async () => {
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);
      const created = fakeUser();
      vi.mocked(usersRepository.create).mockResolvedValue(created);

      const result = await service.register({
        email: "jane@example.com",
        password: "plain-password",
        firstname: "Jane",
      });

      expect(hashPassword).toHaveBeenCalledWith("plain-password");
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "hashed-password",
        firstname: "Jane",
      });
      expect(result.user).toEqual(created);
      expect(result.accessToken).toBe("signed-access-token");
      expect(result.refreshToken).toBe("raw-refresh-token");
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: created.id, tokenHash: "hashed-refresh-token" }),
      );
    });

    it("throws ConflictError when the email is already registered", async () => {
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(fakeUser());

      await expect(
        service.register({ email: "jane@example.com", password: "x" }),
      ).rejects.toThrow(ConflictError);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("issues tokens for valid credentials", async () => {
      const user = fakeUser();
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(user);
      verifyPassword.mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: "plain-password" });

      expect(verifyPassword).toHaveBeenCalledWith("plain-password", user.password);
      expect(result.accessToken).toBe("signed-access-token");
    });

    it("throws UnauthorizedError when the email is not found", async () => {
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);

      await expect(
        service.login({ email: "missing@example.com", password: "x" }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("still calls verifyPassword when the email is not found (constant-time against enumeration)", async () => {
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);

      await expect(
        service.login({ email: "missing@example.com", password: "x" }),
      ).rejects.toThrow(UnauthorizedError);

      expect(verifyPassword).toHaveBeenCalledTimes(1);
      expect(verifyPassword).toHaveBeenCalledWith("x", expect.any(String));
    });

    it("throws UnauthorizedError when the password is wrong", async () => {
      vi.mocked(usersRepository.findByEmail).mockResolvedValue(fakeUser());
      verifyPassword.mockResolvedValue(false);

      await expect(
        service.login({ email: "jane@example.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and issues a new pair", async () => {
      const user = fakeUser();
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue({
        id: "rt-1",
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
        createdAt: new Date(),
      });
      vi.mocked(usersRepository.findById).mockResolvedValue(user);

      const result = await service.refresh("raw-refresh-token");

      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("rt-1");
      expect(result.accessToken).toBe("signed-access-token");
      expect(result.refreshToken).toBe("raw-refresh-token");
    });

    it("throws UnauthorizedError when the token does not exist", async () => {
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue(null);

      await expect(service.refresh("unknown-token")).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError and revokes all tokens when a revoked token is replayed", async () => {
      const user = fakeUser();
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue({
        id: "rt-1",
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: new Date(),
        createdAt: new Date(),
      });

      await expect(service.refresh("stolen-token")).rejects.toThrow(UnauthorizedError);
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(user.id);
    });

    it("throws UnauthorizedError when the token is expired", async () => {
      const user = fakeUser();
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue({
        id: "rt-1",
        userId: user.id,
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        createdAt: new Date(),
      });

      await expect(service.refresh("expired-token")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("logout", () => {
    it("revokes the matching refresh token", async () => {
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue({
        id: "rt-1",
        userId: "user-1",
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date(Date.now() + 1000),
        revokedAt: null,
        createdAt: new Date(),
      });

      await service.logout("raw-refresh-token");

      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("rt-1");
    });

    it("does not throw when the token is unknown (already logged out)", async () => {
      vi.mocked(refreshTokenRepository.findByHash).mockResolvedValue(null);

      await expect(service.logout("unknown-token")).resolves.toBeUndefined();
      expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    });
  });
});
