# Debian-based, not alpine (unlike apps/api and apps/dashboard) — Playwright's `--with-deps`
# shells out to `apt-get` to install Chromium's shared-lib dependencies, which doesn't exist on
# Alpine (musl, no apt). Playwright doesn't officially support Alpine/musl for Chromium at all;
# this isn't a style choice, the crawler cannot launch a browser without it.
FROM node:22-slim
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vinted-hunter/database exec prisma generate
# Uses turbo's build-graph — see apps/api/Dockerfile for why this can't just be
# `pnpm --filter worker build` once worker actually imports @vinted-hunter/database.
RUN pnpm exec turbo run build --filter=worker
RUN pnpm --filter worker exec playwright install --with-deps chromium

# Stays root (unlike apps/api and apps/dashboard) — Chromium's sandbox needs either root or
# extra seccomp/user-namespace setup to launch as an unprivileged user in a container, and
# getting that wrong silently breaks the crawler. Not worth the risk for a non-root win here
# without dedicated testing; revisit if this ever needs to run under a stricter host policy.
CMD ["pnpm", "--filter", "worker", "start"]
