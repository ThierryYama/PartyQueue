FROM node:22.22.2-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /workspace

COPY . .

ARG NEXT_PUBLIC_API_URL="http://localhost:3333/api/v1"
ENV NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @partyqueue/web build

FROM node:22.22.2-bookworm-slim AS runtime

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "apps/web/server.js"]
