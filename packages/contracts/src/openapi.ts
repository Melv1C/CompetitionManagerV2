import {
  clubCreateRequestSchema,
  clubListResponseSchema,
  clubMembershipSchema,
  clubResponseSchema,
  clubSchema,
} from "./clubs";
import { apiErrorEnvelopeSchema } from "./errors";
import {
  healthRequestSchema,
  liveHealthSchema,
  operationsHealthSchema,
  readyHealthSchema,
} from "./health";

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
      "/api/v1/clubs": {
        get: clubOperation("listClubs", clubListResponseSchema, "List Clubs managed by the user."),
        post: clubCreateOperation(),
      },
      "/api/v1/clubs/{clubId}": {
        get: {
          ...clubOperation("getClub", clubResponseSchema, "Retrieve a manager's Club."),
          parameters: [
            {
              name: "clubId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
    },
    components: {
      schemas: {
        HealthRequest: schemaFor(healthRequestSchema),
        LiveHealth: schemaFor(liveHealthSchema),
        ReadyHealth: schemaFor(readyHealthSchema),
        OperationsHealth: schemaFor(operationsHealthSchema),
        ApiErrorEnvelope: schemaFor(apiErrorEnvelopeSchema),
        ClubCreateRequest: schemaFor(clubCreateRequestSchema),
        Club: schemaFor(clubSchema),
        ClubMembership: schemaFor(clubMembershipSchema),
        ClubResponse: schemaFor(clubResponseSchema),
        ClubListResponse: schemaFor(clubListResponseSchema),
      },
    },
  };
}

function clubOperation(operationId: string, responseSchema: unknown, description: string) {
  return {
    operationId,
    description,
    responses: {
      "200": jsonResponse(responseSchema, "Successful response."),
      "401": errorResponse("Authentication is required."),
      "403": errorResponse("Email verification is required."),
      "404": errorResponse("Club not found."),
      "500": errorResponse("Unexpected server failure."),
    },
  };
}

function clubCreateOperation() {
  return {
    operationId: "createClub",
    description: "Create a Club and its initial manager membership atomically.",
    parameters: [
      {
        name: "Idempotency-Key",
        in: "header",
        required: false,
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaFor(clubCreateRequestSchema) } },
    },
    responses: {
      "201": jsonResponse(clubResponseSchema, "Club created."),
      "400": errorResponse("Invalid Club profile."),
      "401": errorResponse("Authentication is required."),
      "403": errorResponse("Email verification is required."),
      "409": errorResponse("Idempotency key was already used for another request."),
      "500": errorResponse("Unexpected server failure."),
    },
  };
}

function jsonResponse(schema: unknown, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: schemaFor(schema as Parameters<typeof schemaFor>[0]),
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
