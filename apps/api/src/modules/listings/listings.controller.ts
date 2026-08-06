import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { idParamSchema, listingsQuerySchema, paginationQuerySchema } from "@vinted-hunter/shared";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { createFavoritesRepository } from "./favorites.repository.js";
import { createListingsRepository } from "./listings.repository.js";
import { createListingsService } from "./listings.service.js";

export async function listingsController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const listingsRepository = createListingsRepository(app.prisma);
  const favoritesRepository = createFavoritesRepository(app.prisma);
  const listingsService = createListingsService({ listingsRepository, favoritesRepository });

  app.get(
    "/listings",
    { schema: { querystring: listingsQuerySchema } },
    async (request, reply) => {
      const { page, limit, sortBy } = request.query;
      const result = await listingsService.list(page, limit, sortBy);
      reply.send(
        success(result.items, { total: result.total, page: result.page, limit: result.limit }),
      );
    },
  );

  // Registered before /listings/:id — Fastify's router prioritizes static segments over
  // param segments regardless of order, but the explicit ordering keeps this readable.
  app.get(
    "/listings/favorites",
    { schema: { querystring: paginationQuerySchema }, preHandler: requireAuth },
    async (request, reply) => {
      const { page, limit } = request.query;
      const result = await listingsService.listFavorites(request.user.sub, page, limit);
      reply.send(
        success(result.items, { total: result.total, page: result.page, limit: result.limit }),
      );
    },
  );

  app.get("/listings/:id", { schema: { params: idParamSchema } }, async (request, reply) => {
    const listing = await listingsService.getById(request.params.id);
    reply.send(success(listing));
  });

  app.post(
    "/listings/:id/favorite",
    { schema: { params: idParamSchema }, preHandler: requireAuth },
    async (request, reply) => {
      const result = await listingsService.toggleFavorite(request.user.sub, request.params.id);
      reply.send(success(result));
    },
  );
}
