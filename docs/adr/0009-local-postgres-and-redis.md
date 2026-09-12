# Local PostgreSQL and Redis services

Local development uses PostgreSQL 16 and Redis 7 through the checked-in Compose file. API readiness probes both services through real protocol commands. Health checks are dependency-injected in tests so the HTTP contract can be verified without hiding an unavailable local service.
