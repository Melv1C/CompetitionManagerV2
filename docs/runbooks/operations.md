## Queue operations

The API operations endpoint is `/api/v1/health/operations`. It reports Redis queue availability, queued and delayed depth, and the number of terminal failures. It intentionally excludes payloads and error messages.

Start the local dependencies and worker with:

```bash
docker compose up -d redis
bun run --cwd apps/worker dev
```

Every job has a stable name, schema version, business key, idempotency key, attempt count, timestamps, and request/correlation identifiers. Enqueue uses an atomic Redis claim, so repeating a request with the same idempotency key returns the existing job. Redis is the delivery mechanism; future feature slices must couple job creation to their database write through a transactional outbox.

Retries are durable: the worker places retryable failures in a Redis sorted set with bounded exponential backoff and jitter. A process restart promotes due jobs and recovers jobs left in the processing list. Once the attempt limit is reached, the job is marked `failed` and included in the terminal failure count.

For operator recovery, obtain the stable job id from the queue inspection boundary and call `retryFailed(jobId)` on the infrastructure queue. The operation is conditional on the record still being terminally failed, removes it from the failure set, and requeues the same record. Repeating the operator action is a no-op, and no new business key or idempotency record is created.

On `SIGINT` or `SIGTERM`, the worker stops accepting new work, finishes the current handler, and closes Redis. The blocking consume call has a one-second timeout so an idle worker exits promptly without an in-memory retry timer.
