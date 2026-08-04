import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParamSchema } from '@vinted-hunter/shared';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { success } from '../../utils/response.js';
import { createAnalysisRepository } from './analysis.repository.js';
import { createAnalysisService, type AnalysisQueueProducer } from './analysis.service.js';

// Takes the queue producer as a parameter (rather than constructing one internally, unlike
// other controllers) since it's the one thing here that isn't derivable from `app.prisma` —
// apps/api owns a single Redis-backed Queue for its whole lifetime (see app.ts), not one per
// request.
export function createAnalysisController(queue: AnalysisQueueProducer): FastifyPluginAsync {
  return async function analysisController(fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    const analysisRepository = createAnalysisRepository(app.prisma);
    const analysisService = createAnalysisService({ analysisRepository, queue });

    // §21.4's path is documented as `/analysis/:listingId` — using `:id` here to reuse the
    // shared idParamSchema, matching this repo's existing convention (/listings/:id, /searches/:id).
    app.post(
      '/analysis/:id',
      { schema: { params: idParamSchema }, preHandler: requireAuth },
      async (request, reply) => {
        const result = await analysisService.triggerAnalysis(request.params.id);
        reply.status(202).send(success(result));
      },
    );

    app.get('/analysis/:id', { schema: { params: idParamSchema } }, async (request, reply) => {
      const analysis = await analysisService.getByListingId(request.params.id);
      reply.send(success(analysis));
    });
  };
}
