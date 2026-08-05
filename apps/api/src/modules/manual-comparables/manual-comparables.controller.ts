import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createManualComparableSchema, idParamSchema } from "@vinted-hunter/shared";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { createManualComparablesRepository } from "./manual-comparables.repository.js";
import { createManualComparablesService } from "./manual-comparables.service.js";

const listingIdParamSchema = z.object({ listingId: z.string().uuid() });

export async function manualComparablesController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const manualComparablesRepository = createManualComparablesRepository(app.prisma);
  const manualComparablesService = createManualComparablesService({ manualComparablesRepository });

  app.get(
    "/listings/:listingId/manual-comparables",
    { schema: { params: listingIdParamSchema } },
    async (request, reply) => {
      const items = await manualComparablesService.listForListing(request.params.listingId);
      reply.send(success(items));
    },
  );

  app.post(
    "/listings/:listingId/manual-comparables",
    {
      schema: { params: listingIdParamSchema, body: createManualComparableSchema },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const created = await manualComparablesService.create({
        userId: request.user.sub,
        listingId: request.params.listingId,
        price: request.body.price,
        currency: request.body.currency ?? "EUR",
        sourceName: request.body.sourceName,
        sourceUrl: request.body.sourceUrl ?? null,
        note: request.body.note ?? null,
      });
      reply.status(201).send(success(created));
    },
  );

  app.delete(
    "/manual-comparables/:id",
    { schema: { params: idParamSchema }, preHandler: requireAuth },
    async (request, reply) => {
      await manualComparablesService.delete(request.user.sub, request.params.id);
      reply.status(204).send();
    },
  );
}
