# Repository instructions

This is a Bun and Turborepo monorepo. Read `README.md`, the relevant package's `package.json`, and its source before changing code.

## Project boundaries

- `apps/api` contains the Hono API, Better Auth configuration, Prisma schema and database access, and Socket.IO server.
- `apps/frontend` contains the public and registrant React application.
- `apps/manager` contains the Organization manager React application.
- `apps/admin` contains the platform-administration React application.
- `apps/worker` contains the BullMQ background-job consumer.
- `packages/jobs` owns shared BullMQ queue names, payload types, producer helpers, and worker helpers.
- Put shared schemas, utilities, and Socket.IO types in `packages/utils`.
- Put reusable React components in `packages/ui`.
- Put shared TypeScript configurations in `packages/typescript-config`.
- Put browser-level tests and their Docker-backed setup in `tests/e2e`.
- Treat `routeTree.gen.ts` files as generated output.
- Treat `apps/api/generated/prisma` and `env.d.ts` files as generated output.

## Documentation

- `README.md` documents the repository as it works now. Keep planned features clearly separate from implemented behavior.
- `CONTEXT.md` is the domain glossary. Keep implementation details out of it and use its canonical terms in code and documentation.
- `docs/adr` records durable architectural and product decisions. Update an existing record when correcting its wording; add a new record when a decision changes.
- `docs/operations.md` documents runtime behavior and data-handling rules.

## Working rules

- Use Bun commands and workspace filters. Do not introduce another package manager.
- Keep changes within the smallest relevant workspace.
- Add or update tests when behavior changes.
- Update environment schemas when adding environment variables, then run `bun run env:generate`.
- Keep secrets and local environment values out of version control.
- For every public or registrant UI change in `apps/frontend`, read and follow `.agents/skills/mobile-first-frontend/SKILL.md`.
- When a shared Zod schema contains Prisma model fields or enums, read and follow `.agents/skills/prisma-zod-contracts/SKILL.md`.

## Verification

After a clean checkout, generate the ignored environment types and Prisma client before running verification:

```bash
bun run env:generate
bun run prisma:generate
```

Build workspace packages before checks that consume their emitted types. Run focused tests while developing. Before finishing a repository-wide change, run:

```bash
bun run build
bun run check
bun run test
```

Report any command that could not run and why.
