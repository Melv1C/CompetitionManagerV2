import { apiErrorEnvelopeSchema } from "./errors";
import {
  healthRequestSchema,
  liveHealthSchema,
  operationsHealthSchema,
  readyHealthSchema,
} from "./health";
import {
  eligibleUserListResponseSchema,
  organizationCreateRequestSchema,
  organizationListResponseSchema,
  organizationResponseSchema,
} from "./organizations";

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
      "/api/v1/health/operations": {
        get: healthOperation(
          "operationsHealth",
          operationsHealthSchema,
          "Queue operations health.",
          true,
        ),
      },
      "/api/v1/admin/users": {
        get: jsonOperation(
          "adminEligibleUsers",
          eligibleUserListResponseSchema,
          "List verified, eligible users for platform administration.",
        ),
      },
      "/api/v1/admin/organizations": {
        post: jsonOperation(
          "createOrganization",
          organizationResponseSchema,
          "Create an Organization and its initial owner membership.",
          organizationCreateRequestSchema,
          201,
        ),
      },
      "/api/v1/manager/organizations": {
        get: jsonOperation(
          "listManagerOrganizations",
          organizationListResponseSchema,
          "List Organizations owned by the authenticated user.",
        ),
      },
      "/api/v1/manager/organizations/{organizationId}": {
        get: jsonOperation(
          "getManagerOrganization",
          organizationResponseSchema,
          "Load one Organization owned by the authenticated user.",
        ),
      },
    },
    components: {
      schemas: {
        HealthRequest: schemaFor(healthRequestSchema),
        LiveHealth: schemaFor(liveHealthSchema),
        ReadyHealth: schemaFor(readyHealthSchema),
        OperationsHealth: schemaFor(operationsHealthSchema),
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

function jsonOperation(
  operationId: string,
  responseSchema: unknown,
  description: string,
  requestSchema?: unknown,
  successStatus = 200,
) {
  return {
    operationId,
    description,
    ...(requestSchema
      ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: schemaFor(requestSchema as Parameters<typeof schemaFor>[0]),
              },
            },
          },
        }
      : {}),
    responses: {
      [String(successStatus)]: {
        description: "Successful response.",
        content: {
          "application/json": {
            schema: schemaFor(responseSchema as Parameters<typeof schemaFor>[0]),
          },
        },
      },
      "400": errorResponse("Malformed request."),
      "401": errorResponse("Authentication required."),
      "403": errorResponse("Insufficient permission."),
      "404": errorResponse("Resource not found."),
      "409": errorResponse("Request conflicts with existing state."),
    },
  };
}

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorEnvelope" } } },
  };
}
