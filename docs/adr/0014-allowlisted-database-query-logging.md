# Allowlist database query metadata in shared logs

Test, staging, and production logs retain only query duration, Prisma target, and an allowlisted
SQL operation because SQL text and parameters may contain personal or financial data that cannot
be reliably removed after Loki ingests it. Development logs retain SQL and parameters for local
diagnostics, accepting the extra exposure only in that environment.
