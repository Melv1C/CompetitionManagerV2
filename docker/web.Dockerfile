FROM oven/bun:1 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS prepare
ARG APP_NAME=frontend
COPY . .
RUN bunx turbo prune @competition-manager/${APP_NAME} --docker

FROM base AS installer
COPY --from=prepare /app/out/json/ ./
RUN bun install --frozen-lockfile

FROM base AS builder
ARG APP_NAME=frontend
COPY --from=installer /app/ ./
COPY --from=prepare /app/out/full/ ./
COPY .env.shared ./.env.shared
RUN bun run env:generate
RUN bun run build --filter=@competition-manager/${APP_NAME}

FROM nginx:alpine AS runner
ARG APP_NAME=frontend
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
