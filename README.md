# Fullstack Turbo Kit

A production-ready [Turborepo](https://turbo.build/repo) monorepo starter with full-stack applications and shared packages.

## What's Inside?

### Apps

- **api** — [Hono](https://hono.dev/) API server with [Better Auth](https://better-auth.com/), [Prisma](https://www.prisma.io/), and [Socket.IO](https://socket.io/)
- **frontend** — [Vite](https://vitejs.dev/) + [React](https://react.dev/) application
- **manager** — Vite + React organization-management application
- **admin** — Vite + React admin application (real-time logs via WebSockets)
- **worker** — background-job process

### Packages

- **@repo/utils** — Shared utility functions, Zod schemas, and Socket.IO types
- **@repo/jobs** — Shared BullMQ queue and worker contract
- **@repo/typescript-config** — TypeScript configurations
- **@repo/ui** — Shared UI components and design system

All packages and apps are written in [TypeScript](https://www.typescriptlang.org/).

## Architecture

```mermaid
flowchart LR
  subgraph clients["Browser clients"]
    FE[frontend<br/>Vite + React]
    AD[admin<br/>Vite + React]
  end

  subgraph api["api"]
    HONO[Hono REST /api]
    AUTH[Better Auth]
    SIO[Socket.IO]
  end

  DB[(PostgreSQL)]
  REDIS[(Redis)]
  WORKER[worker process]

  FE -->|HTTP + cookies| HONO
  FE -->|auth| AUTH
  AD -->|HTTP + cookies| HONO
  AD -->|auth| AUTH
  AD -->|WebSocket| SIO

  HONO --> DB
  AUTH --> DB
  SIO --> AUTH
  HONO -->|enqueue BullMQ jobs| REDIS
  REDIS -->|deliver BullMQ jobs| WORKER
```

| Connection                       | Protocol              | Purpose                           |
| -------------------------------- | --------------------- | --------------------------------- |
| frontend / admin / manager → api | HTTP (`/api/*`)       | REST API, health checks           |
| frontend / admin / manager → api | HTTP (Better Auth)    | Sign-in, sessions, cookies        |
| admin → api                      | WebSocket (Socket.IO) | Real-time admin rooms (e.g. logs) |
| api → PostgreSQL                 | Prisma                | Persistence                       |
| api → Redis                      | BullMQ                | Enqueue durable background jobs   |
| worker → Redis                   | BullMQ                | Consume durable background jobs   |

In development, apps run separately via Turbo (`bun run dev`). The API listens on `API_PORT` (default `3000`); frontend, manager, and admin use Vite dev servers. Socket.IO shares the API HTTP server and allows CORS from `FRONTEND_URL`, `MANAGER_URL`, and `ADMIN_URL`.

For a full local stack in containers, see [docker-compose.yml](./docker-compose.yml) (Postgres + all three apps).

## Getting Started

Install dependencies:

```bash
bun install
```

Check that your environment variables are set up correctly:

```bash
bun run env:validate
```

Start the development infrastructure (PostgreSQL and Redis):

```bash
bun run docker:db
```

Run the Redis-backed BullMQ integration suite:

```bash
REDIS_URL=redis://127.0.0.1:6379/15 bun run test:integration
```

CI starts an isolated Redis service and runs this command after the regular workspace tests.

Migrate the database:

```bash
bun run prisma:migrate
```

Generate the Prisma client:

```bash
bun run prisma:generate
```

Run all apps in development mode:

```bash
bun run dev
```

Default URLs in development:

| App      | URL                   |
| -------- | --------------------- |
| API      | http://localhost:3000 |
| Frontend | http://localhost:5173 |
| Admin    | http://localhost:5174 |
| Manager  | http://localhost:5175 |

## Environment variables

Configuration is managed with [Varlock](https://varlock.dev/). Schemas are the source of truth; run `bun run env:generate` after changing them to refresh TypeScript types.

| File                                                     | Scope                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [.env.shared](./.env.shared)                             | Ports, `APP_ENV`, and public URLs (`API_URL`, `FRONTEND_URL`, `MANAGER_URL`, `ADMIN_URL`) |
| [apps/api/.env.schema](./apps/api/.env.schema)           | `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`                                         |
| [apps/worker/.env.schema](./apps/worker/.env.schema)     | `REDIS_URL`                                                                               |
| [apps/frontend/.env.schema](./apps/frontend/.env.schema) | Imports shared schema only                                                                |
| [apps/manager/.env.schema](./apps/manager/.env.schema)   | Imports shared schema only                                                                |
| [apps/admin/.env.schema](./apps/admin/.env.schema)       | Imports shared schema only                                                                |

## First admin user

After the database is migrated and the API can connect, create the first admin account:

```bash
bun --filter api add-admin -- "Admin User" admin@example.com your-secure-password
```

The script signs up the user via Better Auth, sets `role` to `admin`, and marks the email as verified. If the email already exists, it exits without changes.

Requires the same env as the API (`DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.). Run `bun run env:validate` from the repo root first if unsure.

## Deployment

Deployments use GitHub Actions, Docker Hub, and [Dokploy](https://dokploy.com/). Images are built from each app’s `Dockerfile` at the monorepo root.

### Staging

| Trigger                                      | What happens                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Push to `main` (or manual workflow dispatch) | CI → build `admin`, `api`, `frontend`, `manager`, and `worker` with `APP_ENV=staging` → push `*:staging` and `*:<sha>` tags → Dokploy staging deploy per app |

Configure GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DOKPLOY_DOMAIN`, `DOKPLOY_API_KEY`, and `DOKPLOY_STAGING_{ADMIN,API,FRONTEND,MANAGER,WORKER}_APP_ID`.

### Production

| Trigger                                                              | What happens                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Git tag `admin@*`, `api@*`, `frontend@*`, `manager@*`, or `worker@*` | Build single app image → push `:latest` and `:<version>` → Dokploy production deploy |

Web apps are built with `APP_ENV=production`. The API and worker images use runtime environment values from Dokploy (database, secrets, URLs).

Production releases typically use [Changesets](https://github.com/changesets/changesets): `bun run release:prepare`, then `bun run release:version` and `bun run release:push`.

Configure GitHub secrets: same Docker Hub and Dokploy keys, plus `DOKPLOY_PROD_{ADMIN,API,FRONTEND,MANAGER,WORKER}_APP_ID`.

Workflow definitions: [.github/workflows/staging.yml](./.github/workflows/staging.yml), [.github/workflows/production.yml](./.github/workflows/production.yml).
