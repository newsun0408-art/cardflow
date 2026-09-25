FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY shared/package.json ./shared/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_GATEWAY_URI=http://localhost:8080
ENV NEXT_PUBLIC_API_GATEWAY_URI=http://localhost:8080
RUN pnpm --filter @cardflow-app/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/shared ./shared

EXPOSE 3000

CMD ["pnpm", "--filter", "@cardflow-app/web", "start"]
