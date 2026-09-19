# Operations

## Logging

The API writes structured application logs to Loki when `LOKI_HOST` is configured. Do not
include credentials, personal data, payment data, request bodies, SQL, or database parameters
in log messages or metadata.

Prisma query events are enabled only when `APP_ENV=development`. Their metadata contains query
duration as `durationMs`; it never contains SQL or parameter values. Staging, production, and
test environments do not emit Prisma query events.
