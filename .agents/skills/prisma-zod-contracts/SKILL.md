---
name: prisma-zod-contracts
description: Design or review shared Zod schemas that contain Prisma model fields or enums. Derive persistence-backed fields from generated Prisma Zod schemas, then add only transport structure and stricter public validation by hand. Skip for schemas with no Prisma-backed fields.
---

# Prisma Zod contracts

Keep the Prisma schema as the source of truth for persistence-backed fields without exposing database models as public contracts.

## Build the contract

1. Read the relevant model or enum in `apps/api/prisma/schema.prisma` and its generated schema under `packages/utils/src/generated/prisma-zod/schemas`.
2. Import generated enum schemas directly. For model fields, create a base with `.pick()` or `.omit()` from the generated model schema.
3. Use `.extend()` for public-contract differences only:
   - transport-only nested objects or computed fields;
   - stricter validation such as UUIDs, lengths, literals, and discriminators;
   - serialization coercion such as JSON date strings to `Date`;
   - deliberate omission of internal fields.
4. Keep fully transport-only schemas handwritten.

Do not copy Prisma enum members or recreate Prisma-backed primitive fields in a standalone `z.object()`. A generated base makes renamed or removed fields fail the TypeScript build after regeneration.

Example:

```ts
import * as z from "zod";

import { AthleteImportStateSchema } from "../generated/prisma-zod/schemas/enums/AthleteImportState.schema";
import { AthleteImportBatchSchema } from "../generated/prisma-zod/schemas/models/AthleteImportBatch.schema";

export const AthleteImportState$ = AthleteImportStateSchema;

const PersistedBatchFields$ = AthleteImportBatchSchema.pick({
  id: true,
  state: true,
  createdAt: true,
});

export const AthleteImportBatch$ = PersistedBatchFields$.extend({
  id: AthleteImportBatchSchema.shape.id.pipe(z.uuid()),
  createdAt: z.coerce.date(),
  summary: AthleteImportSummary$,
});
```

## Verify

Generated files are ignored and must not be edited. Run:

```bash
bun run prisma:generate
bun run --filter @repo/utils build
```

Then run focused tests for the changed contract and its consumers. The work is complete when every Prisma-backed field comes from a generated schema or has an explicit transport-level override, and the generated build passes.
