FROM node:22-alpine
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vinted-hunter/database exec prisma generate
RUN pnpm --filter api build

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
