# Operations

## Logging

The API writes structured application logs to Loki when `LOKI_HOST` is configured. In staging
and production, do not include credentials, personal data, payment data, request bodies, SQL, or
database parameters in log messages or metadata.

Prisma query events are logged at `debug` in every environment. Their metadata contains query
duration as `durationMs`, an allowlisted SQL operation, and Prisma's internal `target`.
Development logs also contain SQL and parameter values for local diagnostics. Test, staging, and
production logs omit SQL and parameter values.

See [ADR 0014](./adr/0014-allowlisted-database-query-logging.md) for the rationale behind this
environment boundary.
