FROM oven/bun:1 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS prepare
COPY . .
RUN bunx turbo prune @competition-manager/api --docker

FROM base AS installer
COPY --from=prepare /app/out/json/ ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=installer /app/ ./
COPY --from=prepare /app/out/full/ ./
COPY .env.shared ./.env.shared
RUN bun run env:generate
RUN bun --filter=@competition-manager/api run prisma:generate
RUN bun run build --filter=@competition-manager/api

FROM base AS runner
RUN groupadd --system --gid 1001 competition && useradd --system --uid 1001 --gid competition competition
USER competition
WORKDIR /app
COPY --from=builder --chown=competition:competition /app/apps /app/apps
COPY --from=builder --chown=competition:competition /app/packages /app/packages
COPY --from=builder --chown=competition:competition /app/node_modules /app/node_modules
COPY --from=builder --chown=competition:competition /app/package.json /app/bunfig.toml /app/turbo.json /app/
COPY --from=builder --chown=competition:competition /app/.env.shared /app/.env.shared
EXPOSE 3000
CMD ["bun", "--filter=@competition-manager/api", "run", "start"]
