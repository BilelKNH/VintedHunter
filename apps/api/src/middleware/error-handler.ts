import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { failure } from "../utils/response.js";

function hasValidationArray(error: unknown): error is FastifyError {
  return (
    typeof error === "object" &&
    error !== null &&
    "validation" in error &&
    Array.isArray((error as FastifyError).validation)
  );
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(failure(error.code, error.message));
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(failure("VALIDATION_ERROR", "Invalid request", error.flatten()));
      return;
    }

    // fastify-type-provider-zod's validator compiler surfaces schema failures as a standard
    // FastifyError with a populated `validation` array rather than a raw ZodError.
    if (hasValidationArray(error)) {
      reply.status(400).send(failure("VALIDATION_ERROR", "Invalid request", error.validation));
      return;
    }

    request.log.error(error);
    reply.status(500).send(failure("INTERNAL_ERROR", "Something went wrong"));
  });
}
