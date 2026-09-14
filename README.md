# Competition Manager V2

Clean-room rewrite of Competition Manager as a production-ready, multi-tenant SaaS for Belgian athletics competitions.

This repository currently contains the approved product and engineering specification. Application code should be created from scratch by executing the delivery phases in order.

## Start building

1. Read [the domain glossary](CONTEXT.md).
2. Read the architectural decisions in [docs/adr](docs/adr).
3. Start with **Phase 0: Foundation** from the specification.
4. Keep `CONTEXT.md`, ADRs, and documentation up to date while implementing.

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

The specification takes precedence over all reference repositories.

## Status

Documentation approved. Implementation has not started.
