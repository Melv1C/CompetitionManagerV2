# Competition Manager V2

Clean-room rewrite of Competition Manager as a production-ready, multi-tenant SaaS for Belgian athletics competitions.

This repository currently contains the approved product and engineering specification. Application code should be created from scratch by executing the delivery phases in order.

## Start building

1. Read [the complete build specification](docs/competition-manager-rewrite-agent-spec.md).
2. Read [the domain glossary](CONTEXT.md).
3. Read the architectural decisions in [docs/adr](docs/adr).
4. Start with **Phase 0: Foundation** from the specification.
5. Keep `CONTEXT.md`, ADRs, OpenAPI, and requirement traceability current while implementing.

## Initial application boundaries

- `apps/backend`: API, authentication, realtime gateway, worker entrypoint
- `apps/frontend`: public results, registrations, and User account
- `apps/manager`: Organization competition management
- `apps/admin`: platform administration

The desktop bridge is a later phase and is not part of the initial implementation.

## Reference repositories

- [Legacy behavior](https://github.com/Melv1C/CompetitionManagerSaaS)
- [Incomplete rewrite evidence](https://github.com/Melv1C/CompetitionManager)
- [Preferred monorepo conventions](https://github.com/Melv1C/fullstack-web-turbo-kit)

The specification takes precedence over all reference repositories.

## Status

Documentation approved. Implementation has not started.
