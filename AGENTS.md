# Repository instructions

This is a Bun and Turborepo monorepo. Read `README.md` and the relevant package before changing code.

## Project boundaries

- `apps/backend` contains the Hono API, authentication, database access, and Socket.IO server.
- `apps/frontend` and `apps/admin` contain the React applications.
- Put shared schemas, utilities, and Socket.IO types in `packages/utils`.
- Put reusable React components in `packages/ui`.
- Treat `routeTree.gen.ts` files as generated output.

## Working rules

- Use Bun commands and workspace filters. Do not introduce another package manager.
- Keep changes within the smallest relevant workspace.
- Add or update tests when behavior changes.
- Update environment schemas when adding environment variables, then run `bun run env:generate`.
- Keep secrets and local environment values out of version control.

## Verification

Run focused tests while developing. Before finishing a repository-wide change, run:

```bash
bun run check
bun run test
bun run build
```

Report any command that could not run and why.
