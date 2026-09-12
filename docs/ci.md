# CI contract

CI is intentionally small while the repository is documentation-only. It runs the traceability check on every push and pull request. As implementation lands, the same workflow grows to include the approved specification's frozen install, environment validation, Prisma checks, formatting/lint/boundary/dead-code/type checks, unit/component/integration tests, builds, containerized Playwright, migration checks, OpenAPI diff, translation completeness, and security scans.

## Traceability gate

Run:

```sh
bun run docs:check
```

The check extracts the Appendix A IDs from `docs/competition-manager-rewrite-agent-spec.md` and compares them with `docs/traceability.md`. Duplicate or missing IDs always fail. Before implementation begins, planned target paths are valid references and all rows must remain explicitly unverified. Once `apps/` or `packages/` exists, an empty or placeholder implementation/test reference fails the check.

## Required future gates

The implementation phases must add these root commands and keep them green:

```text
bun run dev
bun run build
bun run check
bun run test
bun run test:integration
bun run e2e
bun run db:generate
bun run db:migrate
bun run db:deploy
bun run openapi:generate
bun run env:generate
bun run env:validate
```

Critical money, authorization, eligibility, registration, capacity, payment, import, and result modules require at least 90% branch coverage. CI must publish actionable test artifacts and must not treat a green documentation gate as evidence that P0 application requirements are verified.
