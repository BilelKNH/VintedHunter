FROM node:22-alpine
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vinted-hunter/database exec prisma generate
# Uses turbo's build-graph (turbo.json: build depends on "^build") so @vinted-hunter/database
# and @vinted-hunter/shared get compiled to dist/ first — their dist/ output is dockerignored
# (correctly, to avoid stale artifacts), so it must be generated fresh inside the image.
RUN pnpm exec turbo run build --filter=api

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
