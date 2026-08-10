FROM node:22.22.2-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @partyqueue/api build
RUN pnpm --filter @partyqueue/api deploy --prod --legacy /opt/partyqueue-api

FROM node:22.22.2-bookworm-slim AS runtime

ENV NODE_ENV="production"
ENV PORT="3333"

WORKDIR /app

COPY --from=build --chown=node:node /opt/partyqueue-api ./
COPY --from=build --chown=node:node /workspace/apps/api/dist ./dist

USER node

EXPOSE 3333

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3333/api/v1/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
