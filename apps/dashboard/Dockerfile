FROM node:22-alpine
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter dashboard build

EXPOSE 3000
CMD ["pnpm", "--filter", "dashboard", "start"]
