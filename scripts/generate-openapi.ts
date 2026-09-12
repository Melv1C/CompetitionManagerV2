import { mkdirSync, writeFileSync } from "node:fs";

import { createOpenApiDocument } from "../packages/contracts/src/openapi";

const outputPath = "docs/api/openapi.yaml";
mkdirSync("docs/api", { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`, "utf8");
console.log(`Generated ${outputPath}`);
