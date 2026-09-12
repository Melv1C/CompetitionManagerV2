The checked-in `openapi.yaml` document is generated from the Zod schemas in
`packages/contracts`.

Run `bun run openapi:generate` after changing a request, response, or error
contract. The generator is deterministic, so a clean working tree after the
command confirms that the artifact is current.
