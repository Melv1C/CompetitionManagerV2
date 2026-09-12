import { apiErrorEnvelopeSchema } from "./errors";
import { healthRequestSchema, liveHealthSchema, readyHealthSchema } from "./health";

type JsonSchema = Record<string, unknown>;

function schemaFor(schema: {
  toJSONSchema: (options: { target: "draft-7" }) => JsonSchema;
}): JsonSchema {
  const jsonSchema = schema.toJSONSchema({ target: "draft-7" });
  const { $schema: _schema, ...openApiSchema } = jsonSchema;
  return normalizeOpenApiSchema(openApiSchema);
}

function normalizeOpenApiSchema(value: unknown): JsonSchema {
  if (Array.isArray(value)) return value.map(normalizeOpenApiValue) as unknown as JsonSchema;
  if (value === null || typeof value !== "object") return {};

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, normalizeOpenApiValue(child)]),
  ) as JsonSchema;
  if ("const" in normalized) {
    normalized.enum = [normalized.const];
    delete normalized.const;
  }
  if (Array.isArray(normalized.type)) {
    const types = normalized.type;
    delete normalized.type;
    normalized.oneOf = types.map((type) => ({ type }));
  }
  delete normalized.propertyNames;
  return normalized;
}

function normalizeOpenApiValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeOpenApiValue);
  if (value !== null && typeof value === "object") return normalizeOpenApiSchema(value);
  return value;
}

export function createOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Competition Manager API",
      version: "1.0.0",
      description: "Versioned HTTP contracts for the Competition Manager backend.",
    },
    paths: {
      "/api/v1/health/live": {
        get: healthOperation("liveHealth", liveHealthSchema, "Liveness response."),
      },
      "/api/v1/health/ready": {
        get: healthOperation("readyHealth", readyHealthSchema, "Readiness response.", true),
      },
    },
    components: {
      schemas: {
        HealthRequest: schemaFor(healthRequestSchema),
        LiveHealth: schemaFor(liveHealthSchema),
        ReadyHealth: schemaFor(readyHealthSchema),
        ApiErrorEnvelope: schemaFor(apiErrorEnvelopeSchema),
      },
    },
  };
}

function healthOperation(
  operationId: string,
  responseSchema: unknown,
  description: string,
  hasUnavailableResponse = false,
) {
  return {
    operationId,
    description,
    responses: {
      "200": {
        description: "Successful response.",
        content: {
          "application/json": {
            schema: schemaFor(responseSchema as Parameters<typeof schemaFor>[0]),
          },
        },
      },
      "400": errorResponse("Malformed request."),
      "404": errorResponse("Route not found."),
      "500": errorResponse("Unexpected server failure."),
      ...(hasUnavailableResponse
        ? {
            "503": {
              description: "Dependencies unavailable.",
              content: {
                "application/json": {
                  schema: schemaFor(responseSchema as Parameters<typeof schemaFor>[0]),
                },
              },
            },
          }
        : {}),
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorEnvelope" } } },
  };
}
