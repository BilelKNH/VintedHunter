import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { success } from "../../utils/response.js";
import { createDashboardRepository } from "./dashboard.repository.js";
import { createDashboardService } from "./dashboard.service.js";

export async function dashboardController(fastify: FastifyInstance): Promise<void> {
  const dashboardRepository = createDashboardRepository(fastify.prisma);
  const dashboardService = createDashboardService({ dashboardRepository });

  // Only successRate is genuinely per-user, but nothing public consumes this endpoint — same
  // pragmatic choice as gating all of /purchases/*.
  fastify.get("/dashboard/stats", { preHandler: requireAuth }, async (request, reply) => {
    const stats = await dashboardService.getStats(request.user.sub);
    reply.send(success(stats));
  });
}
