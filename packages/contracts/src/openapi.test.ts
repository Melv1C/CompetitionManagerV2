import { describe, expect, it } from "vitest";

import { createOpenApiDocument } from "./openapi";

describe("OpenAPI contract document", () => {
  it("describes versioned health and Club routes with shared error responses", () => {
    const document = createOpenApiDocument();

    expect(document.openapi).toBe("3.0.3");
    expect(Object.keys(document.paths)).toEqual([
      "/api/v1/health/live",
      "/api/v1/health/ready",
      "/api/v1/health/operations",
      "/api/v1/clubs",
      "/api/v1/clubs/{clubId}",
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
    expect(document.paths["/api/v1/clubs"].post.responses["201"]).toBeDefined();
    expect(document.components.schemas.ClubResponse).toMatchObject({ type: "object" });
  });

  it("is deterministic for reproducible generated artifacts", () => {
    expect(JSON.stringify(createOpenApiDocument(), null, 2)).toBe(
      JSON.stringify(createOpenApiDocument(), null, 2),
    );
  });
});
