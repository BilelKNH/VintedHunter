import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { idParamSchema } from "@vinted-hunter/shared";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { createSearchesRepository } from "./searches.repository.js";
import { createSearchesService } from "./searches.service.js";
import { createSearchSchema, updateSearchSchema } from "./searches.schemas.js";

export async function searchesController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const searchesRepository = createSearchesRepository(app.prisma);
  const searchesService = createSearchesService({ searchesRepository });

  // Scoped to this plugin's encapsulation context — every route below requires auth.
  app.addHook("preHandler", requireAuth);

  app.post("/searches", { schema: { body: createSearchSchema } }, async (request, reply) => {
    const search = await searchesService.create(request.user.sub, request.body);
    reply.status(201).send(success(search));
  });

  app.get("/searches", async (request, reply) => {
    const searches = await searchesService.listByUser(request.user.sub);
    reply.send(success(searches));
  });

  app.patch(
    "/searches/:id",
    { schema: { params: idParamSchema, body: updateSearchSchema } },
    async (request, reply) => {
      const updated = await searchesService.update(
        request.user.sub,
        request.params.id,
        request.body,
      );
      reply.send(success(updated));
    },
  );

  app.delete("/searches/:id", { schema: { params: idParamSchema } }, async (request, reply) => {
    await searchesService.delete(request.user.sub, request.params.id);
    reply.status(204).send();
  });
}
