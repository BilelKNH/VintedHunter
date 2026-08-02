import type { PrismaClient, RefreshToken } from "@vinted-hunter/database";

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(data: CreateRefreshTokenInput): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export function createRefreshTokenRepository(prisma: PrismaClient): RefreshTokenRepository {
  return {
    create: (data) => prisma.refreshToken.create({ data }),
    findByHash: (tokenHash) => prisma.refreshToken.findUnique({ where: { tokenHash } }),
    revoke: async (id) => {
      await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
    },
    revokeAllForUser: async (userId) => {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
  };
}
