FROM oven/bun:1 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS prepare
COPY . .
RUN bunx turbo prune manager --docker

FROM base AS installer
COPY --from=prepare /app/out/json/ .
RUN rm -f package-lock.json
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=installer /app/ .
COPY --from=prepare /app/out/full/ .
COPY .env.shared ./.env.shared
ARG APP_ENV=production
RUN bun run prisma:generate
RUN APP_ENV=${APP_ENV} bun run build --filter=manager

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/manager/dist /usr/share/nginx/html
COPY apps/manager/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 apps/manager/env.sh /docker-entrypoint.d/env.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
