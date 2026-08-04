FROM node:22-alpine
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not read at container
# start — this must be the browser-reachable API origin (http://localhost:3001), not the
# container-internal DNS name (http://api:3001), since the browser calls this, not the
# dashboard container itself.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN pnpm install --frozen-lockfile
# Uses turbo's build-graph so @vinted-hunter/shared gets compiled to dist/ first — see
# apps/api/Dockerfile for why this can't just be `pnpm --filter dashboard build`.
RUN pnpm exec turbo run build --filter=dashboard

# Run as the non-root `node` user node:22-alpine already ships (uid 1000) — Next's production
# server only ever needs read access to the already-built .next output, no runtime writes.
RUN chown -R node:node /repo
USER node

EXPOSE 3000
CMD ["pnpm", "--filter", "dashboard", "start"]
