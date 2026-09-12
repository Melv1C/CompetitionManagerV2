## Local development

Requirements: Bun 1.4 or newer and Docker.

1. Install dependencies with `bun install --frozen-lockfile`.
2. Generate the documented environment template with `bun run env:generate`.
3. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
4. Validate environment configuration with `bun run env:validate`.
5. Start the four applications with `bun run dev`.

## Database migrations

PostgreSQL must be running from the local Compose stack before using Prisma. The
Better Auth configuration in `apps/api/src/lib/auth.ts` is the source for the
Better Auth Prisma models. `bun run db:generate` is the explicit auth-schema
workflow: it runs the Better Auth CLI schema generator first, then regenerates
Prisma Client. Use it after an intentional auth configuration or plugin change.
Routine `bun run build` and `bun run check` use `bun run db:client` instead;
that command only regenerates Prisma Client and does not overwrite the checked-in
Better Auth schema. The checked-in schema and migration are applied to the local
`competition_manager` database with:

```bash
bun run db:generate
bun run db:migrate
```

Do not hand-edit the generated identity or organization models. Update the
Better Auth configuration, rerun `bun run db:generate`, and create a Prisma
migration with `bun run db:migrate`. The Member composite uniqueness constraint
is retained as the application’s database invariant for one membership per
user and organization. The configured Better Auth `organization()` and
`admin()` plugins generate the organization/membership tables plus the admin
fields on `user` (`role`, `banned`, `banReason`, and `banExpires`) and
`session` (`impersonatedBy`). The admin plugin keeps its documented defaults:
new users receive the `user` role and `admin` is the administrative role. No
separate admin tables are required.

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

The API serves liveness at `/health/live`, readiness at `/health/ready`, and queue operations health at `/health/operations` (the versioned `/api/v1/health/*` paths are also available). Readiness checks PostgreSQL with `SELECT 1` and Redis with `PING`; a 503 response is expected until both services are reachable. Operations health reports only queue availability, queued/delayed depth, and the count of terminal failures; job payloads are never returned.

The worker uses the same `REDIS_URL` and can be started independently with `bun run --cwd apps/worker dev`. Jobs are stored in Redis lists and sorted sets, so a worker restart recovers processing entries and delayed retries without relying on process timers. A job's idempotency key (by default, its name and business key) is claimed atomically at enqueue time. Transient failures use bounded exponential backoff with jitter and become visible terminal failures after the configured attempt limit.

For a real Redis integration pass, start the local stack and run:

```bash
docker compose up -d redis
REDIS_INTEGRATION=1 bun run --cwd packages/backend-infrastructure test:integration
```

Operators should inspect `/api/v1/health/operations` before recovery work. Retry a terminal job through the infrastructure queue's `retryFailed(jobId)` operation using its stable job id; this resets only that failed record and enqueues the same idempotent job, so it cannot create a second business job. Do not delete Redis keys to recover work.

The email/password session boundary is mounted at `/api/auth`. Set
`BETTER_AUTH_SECRET` to a generated secret outside local development; Better Auth
uses it to sign sessions and requires it in production. Registration creates an
authenticated session while leaving `user.emailVerified` false. Sensitive actions
are protected server-side at `/api/v1/registrations`, `/api/v1/payments`,
`/api/v1/organizations/invitations/accept`, and the manager entry point. The
server resolves the User from the session cookie; client flags are not trusted.
Unverified users can sign in and use `/api/auth/send-verification-email`, but
protected requests return the stable `EMAIL_NOT_VERIFIED` error.

Local and test environments use the deterministic capture email adapter. Its
messages are available to test fixtures through `capturedVerificationEmails`;
production wiring should provide the durable job enqueuer from the worker
infrastructure. Verification links expire after one hour and are consumed only
once. Tokens are stored hashed in the Verification table and are never written
to application logs or API error details.

Staging and production must provide the exact deployed origins through
`MY_APP_BACKEND_URL`, `MY_APP_FRONTEND_URL`, `MY_APP_MANAGER_URL`, and
`MY_APP_ADMIN_URL`. The environment contract resolves these into the runtime
`BACKEND_URL`, `FRONTEND_URL`, `MANAGER_URL`, and `ADMIN_URL` values used for
Better Auth base URLs and trusted CORS origins.

Stop local services with `docker compose down`. Add `-v` only when intentionally discarding local database and Redis volumes.
