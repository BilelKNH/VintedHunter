import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { PrismaClient } from "@vinted-hunter/database";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export function createPrismaPlugin(client: PrismaClient) {
  return fp(async function prismaPlugin(app: FastifyInstance) {
    app.decorate("prisma", client);

    app.addHook("onClose", async () => {
      await client.$disconnect();
    });
  });
}
