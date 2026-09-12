## Local development

Requirements: Bun 1.4 or newer and Docker.

1. Install dependencies with `bun install --frozen-lockfile`.
2. Generate the documented environment template with `bun run env:generate`.
3. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
4. Validate environment configuration with `bun run env:validate`.
5. Start the four applications with `bun run dev`.

Run the auth-free browser smoke suite with `bun run e2e`. It starts the API and
the frontend, manager, and admin Vite servers on ports 3000 through 3003 and
waits for API readiness before running. PostgreSQL and Redis must be running;
install Chromium once with `bunx playwright install chromium` (use
`bunx playwright install --with-deps chromium` on CI or a fresh Linux host).

The API serves liveness at `/health/live` and readiness at `/health/ready`. Readiness checks PostgreSQL with `SELECT 1` and Redis with `PING`; a 503 response is expected until both services are reachable.

Stop local services with `docker compose down`. Add `-v` only when intentionally discarding local database and Redis volumes.
