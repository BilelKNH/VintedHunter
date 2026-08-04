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

# Run as the non-root `node` user node:22-alpine already ships (uid 1000) — the built process
# only ever needs read access to what's already on disk, no runtime writes to /repo. No chown
# needed: files copied/built as root keep the default umask (world-readable/executable), which
# is all a non-owning user needs to read and run them. (`chown -R` over the full node_modules
# tree was also just slow — 3+ minutes — and unreliable on this host's Docker Desktop.)
USER node

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
