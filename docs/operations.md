# Operations

## Belgian Athletics catalogue

After database migrations, API startup runs `bun --filter api run sync-json-data`. This idempotent command provisions the initial LRBA seasons, Disciplines, and reusable Athlete Categories, filling missing translations without replacing existing Discipline specifications. Run the same command after deploying a new catalogue revision. Platform Disciplines have English, French, and Dutch names. Organization Disciplines require one translation and show its locale when used as a fallback.

The initial catalogue is a curated subset of the January 2026 LBFA specifications. Event eligibility remains an explicit manager choice. Keep old Discipline IDs when specifications change; deactivate an old entry and add a new code and ID for the replacement.

## Logging

The API writes structured application logs to the console in development and to Loki when
`LOKI_HOST` is configured outside the test environment. `LOKI_HOST` is required in staging and
production. The worker currently writes lifecycle and job-processing logs to standard output and
standard error.

In staging and production, do not include credentials, personal data, payment data, request
bodies, SQL, or database parameters in log messages or metadata.

Prisma query events are logged at `debug` in every environment. Their metadata contains query
duration as `durationMs`, an allowlisted SQL operation, and Prisma's internal `target`.
Development logs also contain SQL and parameter values for local diagnostics. Test, staging, and
production logs omit SQL and parameter values.

See [ADR 0014](./adr/0014-allowlisted-database-query-logging.md) for the rationale behind this
environment boundary.

## Health and metrics

`GET /api/health` checks PostgreSQL with `SELECT 1`. It returns HTTP 200 with `status: "ok"` when
the database responds and HTTP 503 with `status: "error"` when it does not.

`GET /metrics` exposes Prometheus metrics collected by the Hono middleware. Neither endpoint
requires authentication.

The worker reports ready only after its BullMQ consumer connects to Redis. It does not expose an
HTTP health endpoint.

## LRBA athlete imports

An LRBA Athlete Directory Import stores its filename, SHA-256 checksum, target season, actor,
status, timestamps, and summary counts. Previewing does not retain the uploaded file or its rows.
Every upload computes a fresh preview, including when its checksum matches an earlier import.
Before the first Athlete, rows without a valid license or any last name, gender, birth date, or Club
details are treated as export metadata and skipped. A row with Athlete details, or any malformed row
after Athlete data starts, fails the whole preview.
Confirmation stages normalized Athlete and Club rows for the worker. A successful transaction
deletes those rows immediately. Failed staging expires after 24 hours, and the worker removes it
during hourly cleanup. The raw CSV bytes are never persisted. Confirmation stores a unique worker
job ID in the same transaction as the staged rows. The API reconciles queued imports with BullMQ
at startup and every 30 seconds, so an API exit or temporary Redis outage cannot strand a batch
between PostgreSQL and the queue.

## Shutdown

On `SIGTERM` or `SIGINT`, the API closes its job producer and then stops its HTTP server. The
worker closes its BullMQ consumer and PostgreSQL pool. Container orchestrators should allow both
processes enough time to finish these handlers before forcing termination; the end-to-end worker
currently uses a 30-second stop grace period.
