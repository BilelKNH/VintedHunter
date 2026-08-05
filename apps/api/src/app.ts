import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import type { PrismaClient } from '@vinted-hunter/database';
import { prisma as defaultPrisma } from '@vinted-hunter/database';
import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { AnalyzeListingJobData } from '@vinted-hunter/shared';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ACCESS_TOKEN_TTL } from './config/constants.js';
import { loadEnv, type Env } from './config/env.js';
import { createPrismaPlugin } from './database/prisma.plugin.js';
import { identifyUser } from './middleware/auth.middleware.js';
import { registerErrorHandler } from './middleware/error-handler.js';
import { rateLimitPlugin } from './middleware/rate-limit.plugin.js';
import { createSecurityPlugin } from './middleware/security.plugin.js';
import { authController } from './modules/auth/auth.controller.js';
import { listingsController } from './modules/listings/listings.controller.js';
import { searchesController } from './modules/searches/searches.controller.js';
import { purchasesController } from './modules/purchases/purchases.controller.js';
import { createAnalysisController } from './modules/analysis/analysis.controller.js';
import type { AnalysisQueueProducer } from './modules/analysis/analysis.service.js';
import { createRedisConnection } from './queue/connection.js';
import { createAnalysisQueue } from './queue/analysis-queue.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: Env;
  }
}

export interface BuildAppOptions {
  env?: Env;
  prisma?: PrismaClient;
  // Inject a fake queue producer in tests to avoid needing a real Redis connection — when
  // omitted, buildApp owns a real BullMQ Queue + Redis connection and closes both on shutdown.
  analysisQueue?: AnalysisQueueProducer;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const env = options.env ?? loadEnv();
  const prisma = options.prisma ?? defaultPrisma;

  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.decorate('config', env);
  app.register(createPrismaPlugin(prisma));
  app.register(createSecurityPlugin(env.CORS_ORIGIN));
  app.register(fastifyCookie, { secret: env.COOKIE_SECRET });
  app.register(fastifyJwt, { secret: env.JWT_SECRET, sign: { expiresIn: ACCESS_TOKEN_TTL } });
  app.register(rateLimitPlugin);

  app.addHook('onRequest', identifyUser);
  registerErrorHandler(app);

  app.get('/health', async () => ({ status: 'ok', service: 'api' }));

  app.register(authController);
  app.register(searchesController);
  app.register(listingsController);
  app.register(purchasesController);

  let ownedConnection: Redis | null = null;
  let ownedQueue: Queue<AnalyzeListingJobData> | null = null;
  let analysisQueue: AnalysisQueueProducer;

  if (options.analysisQueue) {
    analysisQueue = options.analysisQueue;
  } else {
    ownedConnection = createRedisConnection(env.REDIS_URL);
    ownedQueue = createAnalysisQueue(ownedConnection);
    analysisQueue = ownedQueue;
  }

  app.register(createAnalysisController(analysisQueue));
  app.addHook('onClose', async () => {
    await ownedQueue?.close();
    await ownedConnection?.quit();
  });

  return app;
}
