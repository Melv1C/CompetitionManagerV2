# Competition Manager V2

Clean-room rewrite of Competition Manager as a production-ready, multi-tenant SaaS for Belgian athletics competitions.

This repository contains the approved product and engineering specification and the Phase 0 runnable foundation. Product features are added as vertical slices without weakening the documented domain invariants.

## Start building

1. Read [the complete build specification](docs/competition-manager-rewrite-agent-spec.md).
2. Read [the domain glossary](CONTEXT.md).
3. Read the architectural decisions in [docs/adr](docs/adr).
4. Start the local dependencies with `docker compose up -d postgres redis`.
5. Run `bun install`, `bun run env:generate`, `bun run check`, `bun run test`, and `bun run build`.
6. Run the API with `bun run --cwd apps/api dev`; run the worker with `bun run --cwd apps/worker dev`. API liveness is at `http://localhost:3000/health/live` and readiness is at `http://localhost:3000/health/ready`.
7. Keep `CONTEXT.md`, ADRs, and requirement traceability current while implementing.

## Initial application boundaries

- `apps/api`: HTTP API, authentication, and realtime gateway
- `apps/worker`: background jobs and scheduled work
- `apps/frontend`: public results, registrations, and User account
- `apps/manager`: Organization competition management
- `apps/admin`: platform administration

The desktop bridge is a later phase and is not part of the initial implementation.

## Reference repositories

- [Legacy behavior](https://github.com/Melv1C/CompetitionManagerSaaS)
- [Incomplete rewrite evidence](https://github.com/Melv1C/CompetitionManager)
- [Preferred monorepo conventions](https://github.com/Melv1C/fullstack-web-turbo-kit)

The specification takes precedence over all reference repositories.

## Workspace commands

The root scripts follow the `fullstack-web-turbo-kit` conventions: Vite serves the applications, tsdown builds the packages, and oxlint/oxfmt provide the type-aware lint and formatting workflow. Varlock owns environment generation/validation, and Turborepo coordinates the workspace. `bun run dev` starts all application boundaries, while `bun run build`, `bun run check`, `bun run test`, and `bun run test:integration` execute the workspace gates. Database generation and migrations require PostgreSQL from the local stack.

## Status

Phase 0 foundation is implemented. Product delivery follows the phases in the specification. UI primitives use Tailwind CSS v4 and shadcn conventions from `packages/ui`.
