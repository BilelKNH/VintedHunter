import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  idParamSchema,
  paginationQuerySchema,
  recordPurchaseSchema,
  recordSaleSchema,
} from "@vinted-hunter/shared";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { createPurchasesRepository } from "./purchases.repository.js";
import { createPurchasesService } from "./purchases.service.js";

const listingIdParamSchema = z.object({ listingId: z.string().uuid() });

export async function purchasesController(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const purchasesRepository = createPurchasesRepository(app.prisma);
  const purchasesService = createPurchasesService({ purchasesRepository });

  // Scoped to this plugin's encapsulation context — every route below requires auth (purchases
  // and their profit are inherently personal, unlike the public listings catalog).
  app.addHook("preHandler", requireAuth);

  app.get("/purchases/stats", async (request, reply) => {
    const stats = await purchasesService.getStats(request.user.sub);
    reply.send(success(stats));
  });

  // Registered before /purchases/:id — same static-before-parametric caution as
  // listings.controller.ts's /listings/favorites, kept for readability even though Fastify's
  // router already prioritizes static segments regardless of registration order.
  app.get(
    "/purchases/by-listing/:listingId",
    { schema: { params: listingIdParamSchema } },
    async (request, reply) => {
      const purchase = await purchasesService.findDisplayableForListing(
        request.user.sub,
        request.params.listingId,
      );
      reply.send(success(purchase));
    },
  );

  app.get("/purchases", { schema: { querystring: paginationQuerySchema } }, async (request, reply) => {
    const { page, limit } = request.query;
    const result = await purchasesService.listByUser(request.user.sub, page, limit);
    reply.send(
      success(result.items, { total: result.total, page: result.page, limit: result.limit }),
    );
  });

  app.post(
    "/purchases",
    { schema: { body: recordPurchaseSchema } },
    async (request, reply) => {
      const purchase = await purchasesService.recordPurchase(
        request.user.sub,
        request.body.listingId,
        request.body.purchasePrice,
      );
      reply.status(201).send(success(purchase));
    },
  );

  app.patch(
    "/purchases/:id/sell",
    { schema: { params: idParamSchema, body: recordSaleSchema } },
    async (request, reply) => {
      const purchase = await purchasesService.recordSale(
        request.user.sub,
        request.params.id,
        request.body.sellingPrice,
      );
      reply.send(success(purchase));
    },
  );

  app.patch(
    "/purchases/:id/cancel",
    { schema: { params: idParamSchema } },
    async (request, reply) => {
      const purchase = await purchasesService.cancelPurchase(request.user.sub, request.params.id);
      reply.send(success(purchase));
    },
  );
}
