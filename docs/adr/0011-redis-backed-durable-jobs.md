# Use Redis-backed durable jobs

The worker will use Redis with a BullMQ-compatible durable queue for Athlete synchronization, notifications, checkout expiry, waitlist promotion, scheduled lifecycle transitions, import cleanup, and settlement preparation. Jobs must be idempotent, retryable, observable, and coupled to domain writes through a transactional outbox; Redis is a delivery mechanism, not the source of truth.
