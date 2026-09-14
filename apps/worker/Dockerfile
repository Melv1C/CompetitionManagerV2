FROM oven/bun:1 AS prepare
WORKDIR /app
COPY . .
RUN bunx turbo prune worker --docker

FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile --production
COPY --from=prepare /app/out/full/ .
COPY .env.shared ./.env.shared
CMD ["bun", "--filter=worker", "run", "start"]
