FROM oven/bun:1.4.0 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages packages
RUN bun install --frozen-lockfile
COPY apps/backend apps/backend
RUN bun run --cwd packages/contracts build && bun run --cwd packages/config-env build && bun run --cwd apps/backend build

FROM oven/bun:1.4.0-slim
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/package.json apps/backend/package.json
COPY --from=build /app/packages packages
CMD ["bun", "apps/backend/dist/server.js"]
