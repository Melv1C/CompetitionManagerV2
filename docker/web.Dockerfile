FROM oven/bun:1.4.0 AS build
ARG APP_NAME=frontend
WORKDIR /app
COPY package.json bun.lock ./
COPY apps apps
COPY packages packages
RUN bun install --frozen-lockfile
RUN bun run --cwd packages/contracts build && bun run --cwd packages/api-client build && bun run --cwd packages/ui build && bun run --cwd apps/${APP_NAME} build

FROM nginx:1.29-alpine
ARG APP_NAME=frontend
COPY --from=build /app/apps/${APP_NAME}/dist /usr/share/nginx/html
