import { fileURLToPath } from "node:url";

import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";

describe("generated OpenAPI artifact", () => {
  it("is accepted as a valid OpenAPI document", async () => {
    const document = await SwaggerParser.validate(
      fileURLToPath(new URL("../../../docs/api/openapi.yaml", import.meta.url)),
    );

    expect((document as { openapi?: string }).openapi).toBe("3.0.3");
    expect(document.paths?.["/api/v1/health/ready"]?.get?.responses?.["503"]).toBeDefined();
  });
});
