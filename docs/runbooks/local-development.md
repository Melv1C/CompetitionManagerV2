## Local development

Requirements: Bun 1.4 or newer and Docker.

1. Install dependencies with `bun install --frozen-lockfile`.
2. Generate the documented environment template with `bun run env:generate`.
3. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
4. Validate environment configuration with `bun run env:validate`.
5. Start the four applications with `bun run dev`.

## Database migrations

PostgreSQL must be running from the local Compose stack before using Prisma. The
checked-in schema and migration are applied to the local `competition_manager`
database with:

```bash
bun run db:generate
bun run db:migrate
```

`db:migrate` uses `prisma migrate dev` and is intended for local development. A
deployment or clean checkout should use `bun run db:deploy`, which applies all
checked-in migrations without creating a new one. Database integration tests
apply checked-in migrations first, use the same `DATABASE_URL`, and require
PostgreSQL to be reachable:

```bash
bun run test:integration
```

To verify the migration from an empty local database, stop the stack and remove
the local database volume only when its data is disposable, then start
PostgreSQL again before running the commands above:

```bash
docker compose down -v
docker compose up -d postgres
bun run db:deploy
```

The default local connection is
`postgresql://competition:competition@localhost:5432/competition_manager`.

Run the auth-free browser smoke suite with `bun run e2e`. It starts the API and
the frontend, manager, and admin Vite servers on ports 3000 through 3003 and
waits for API readiness before running. PostgreSQL and Redis must be running;
install Chromium once with `bunx playwright install chromium` (use
`bunx playwright install --with-deps chromium` on CI or a fresh Linux host).

The API serves liveness at `/health/live` and readiness at `/health/ready`. Readiness checks PostgreSQL with `SELECT 1` and Redis with `PING`; a 503 response is expected until both services are reachable.

Stop local services with `docker compose down`. Add `-v` only when intentionally discarding local database and Redis volumes.
