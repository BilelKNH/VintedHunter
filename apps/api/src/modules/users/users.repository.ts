import type { PrismaClient, User } from "@vinted-hunter/database";

export interface CreateUserInput {
  email: string;
  password: string;
  firstname?: string | null;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
}

export function createUsersRepository(prisma: PrismaClient): UsersRepository {
  return {
    findById: (id) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    create: (data) => prisma.user.create({ data }),
  };
}
