FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prepare
COPY . .
RUN bunx turbo prune worker --docker

FROM base AS dev-deps
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=dev-deps /app/ ./
COPY --from=prepare /app/out/full/ .
COPY .env.shared ./.env.shared
RUN bun run build --filter=worker

FROM base AS prod-deps
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile --production

FROM base AS runner
COPY --from=builder /app/apps /app/apps
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/package.json /app/bunfig.toml /app/turbo.json /app/
COPY --from=builder /app/.env.shared /app/.env.shared
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/bun.lock /app/bun.lock

CMD ["bun", "--filter=worker", "run", "start"]
