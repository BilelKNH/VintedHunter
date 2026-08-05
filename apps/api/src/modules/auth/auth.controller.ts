import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_AUTH_WINDOW,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_DAYS,
} from "../../config/constants.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { UnauthorizedError } from "../../utils/errors.js";
import { success } from "../../utils/response.js";
import { generateRefreshToken, hashRefreshToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { toPublicUser } from "../../utils/public-user.js";
import { createUsersRepository } from "../users/users.repository.js";
import { createUsersService } from "../users/users.service.js";
import { createAuthService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { createRefreshTokenRepository } from "./refresh-token.repository.js";

export async function authController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const usersRepository = createUsersRepository(app.prisma);
  const refreshTokenRepository = createRefreshTokenRepository(app.prisma);
  const usersService = createUsersService({ usersRepository });
  const authService = createAuthService({
    usersRepository,
    refreshTokenRepository,
    hashPassword,
    verifyPassword,
    generateRefreshToken,
    hashRefreshToken,
    signAccessToken: (payload) => app.jwt.sign(payload),
  });

  function setRefreshCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: app.config.NODE_ENV === "production",
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
      signed: true,
    });
  }

  function readRefreshCookie(request: { cookies: Record<string, string | undefined> }): string {
    const raw = request.cookies[REFRESH_COOKIE_NAME];
    const unsigned = raw ? app.unsignCookie(raw) : null;
    if (!raw || !unsigned?.valid || !unsigned.value) {
      throw new UnauthorizedError("Missing or invalid refresh token");
    }
    return unsigned.value;
  }

  // keyGenerator is set explicitly to IP here (overriding the global user-id-or-ip generator)
  // so an attacker can't defeat this brute-force throttle by simply attaching a Bearer token
  // from their own, separately-registered account to switch rate-limit buckets.
  const authRateLimit = {
    max: RATE_LIMIT_AUTH_MAX,
    timeWindow: RATE_LIMIT_AUTH_WINDOW,
    keyGenerator: (request: { ip: string }) => request.ip,
  };

  app.post(
    "/auth/register",
    {
      schema: { body: registerSchema },
      config: { rateLimit: authRateLimit },
    },
    async (request, reply) => {
      const result = await authService.register(request.body);
      setRefreshCookie(reply, result.refreshToken);
      reply
        .status(201)
        .send(success({ user: toPublicUser(result.user), accessToken: result.accessToken }));
    },
  );

  app.post(
    "/auth/login",
    {
      schema: { body: loginSchema },
      config: { rateLimit: authRateLimit },
    },
    async (request, reply) => {
      const result = await authService.login(request.body);
      setRefreshCookie(reply, result.refreshToken);
      reply.send(success({ user: toPublicUser(result.user), accessToken: result.accessToken }));
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    const rawRefreshToken = readRefreshCookie(request);
    const result = await authService.refresh(rawRefreshToken);
    setRefreshCookie(reply, result.refreshToken);
    reply.send(success({ accessToken: result.accessToken }));
  });

  app.post("/auth/logout", { preHandler: requireAuth }, async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE_NAME];
    const unsigned = raw ? app.unsignCookie(raw) : null;
    if (unsigned?.valid && unsigned.value) {
      await authService.logout(unsigned.value);
    }
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    reply.send(success({ loggedOut: true }));
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = await usersService.getById(request.user.sub);
    reply.send(success(toPublicUser(user)));
  });
}
