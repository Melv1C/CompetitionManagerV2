## Local development

Requirements: Bun 1.4 or newer and Docker.

1. Install dependencies with `bun install --frozen-lockfile`.
2. Generate the documented environment template with `bun run env:generate`.
3. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
4. Validate environment configuration with `bun run env:validate`.
5. Start the four applications with `bun run dev`.

The API serves liveness at `/health/live` and readiness at `/health/ready`. Readiness checks PostgreSQL with `SELECT 1` and Redis with `PING`; a 503 response is expected until both services are reachable.

Stop local services with `docker compose down`. Add `-v` only when intentionally discarding local database and Redis volumes.
