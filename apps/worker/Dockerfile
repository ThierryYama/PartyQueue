FROM node:22.22.2-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="postgresql://build:build@localhost:5432/partyqueue" pnpm --filter @partyqueue/worker... build
RUN pnpm --filter @partyqueue/worker deploy --prod /opt/partyqueue-worker

FROM node:22.22.2-bookworm-slim AS runtime

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=build --chown=node:node /opt/partyqueue-worker ./
COPY --from=build --chown=node:node /workspace/apps/worker/dist ./dist

USER node

CMD ["node", "dist/main.js"]
