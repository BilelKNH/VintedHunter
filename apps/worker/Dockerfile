FROM node:22-alpine
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vinted-hunter/database exec prisma generate
# Uses turbo's build-graph — see apps/api/Dockerfile for why this can't just be
# `pnpm --filter worker build` once worker actually imports @vinted-hunter/database.
RUN pnpm exec turbo run build --filter=worker

CMD ["pnpm", "--filter", "worker", "start"]
