import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { RATE_LIMIT_GLOBAL_MAX, RATE_LIMIT_GLOBAL_WINDOW } from "../config/constants.js";
import { failure } from "../utils/response.js";

export const rateLimitPlugin = fp(async function rateLimitPlugin(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: RATE_LIMIT_GLOBAL_MAX,
    timeWindow: RATE_LIMIT_GLOBAL_WINDOW,
    keyGenerator: (request: FastifyRequest) => request.user?.sub ?? request.ip,
    errorResponseBuilder: () =>
      failure("RATE_LIMITED", "Too many requests, please try again later."),
  });
});
