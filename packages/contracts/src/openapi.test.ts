import { describe, expect, it } from "vitest";

import { createOpenApiDocument } from "./openapi";

describe("OpenAPI contract document", () => {
  it("describes the versioned product routes and shared error response", () => {
    const document = createOpenApiDocument();

    expect(document.openapi).toBe("3.0.3");
    expect(Object.keys(document.paths)).toEqual([
      "/api/v1/health/live",
      "/api/v1/health/ready",
      "/api/v1/health/operations",
      "/api/v1/admin/users",
      "/api/v1/admin/organizations",
      "/api/v1/manager/organizations",
      "/api/v1/manager/organizations/{organizationId}",
    ]);
    expect(
      document.paths["/api/v1/health/live"].get.responses["400"].content["application/json"].schema,
    ).toEqual({
      $ref: "#/components/schemas/ApiErrorEnvelope",
    });
    expect(document.paths["/api/v1/health/ready"].get.responses["503"]).toMatchObject({
      description: "Dependencies unavailable.",
      content: { "application/json": { schema: { type: "object" } } },
    });
    expect(document.components.schemas.LiveHealth).toMatchObject({
      type: "object",
      required: ["status", "service", "timestamp"],
    });
  });

  it("is deterministic for reproducible generated artifacts", () => {
    expect(JSON.stringify(createOpenApiDocument(), null, 2)).toBe(
      JSON.stringify(createOpenApiDocument(), null, 2),
    );
  });
});
