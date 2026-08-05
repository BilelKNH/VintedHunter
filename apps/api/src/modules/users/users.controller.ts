import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { updateNotificationSettingsSchema } from "@vinted-hunter/shared";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { toPublicUser } from "../../utils/public-user.js";
import { createUsersRepository } from "./users.repository.js";
import { createUsersService } from "./users.service.js";

export async function usersController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const usersRepository = createUsersRepository(app.prisma);
  const usersService = createUsersService({ usersRepository });

  app.patch(
    "/users/me/notification-settings",
    { schema: { body: updateNotificationSettingsSchema }, preHandler: requireAuth },
    async (request, reply) => {
      const updated = await usersService.updateNotificationSettings(
        request.user.sub,
        request.body,
      );
      reply.send(success(toPublicUser(updated)));
    },
  );
}
