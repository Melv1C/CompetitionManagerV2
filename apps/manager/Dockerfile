FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bunx turbo prune manager --docker

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=build /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=build /app/out/full/ .
COPY .env.shared ./.env.shared
ARG APP_ENV=production
RUN APP_ENV=${APP_ENV} bun run build --filter=manager

FROM nginx:alpine
COPY --from=builder /app/apps/manager/dist /usr/share/nginx/html
COPY apps/manager/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
