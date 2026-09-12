import {
  apiErrorEnvelopeSchema,
  type ApiErrorCode,
  type ApiErrorEnvelope,
} from "@competition-manager/contracts";
import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const requestIdHeader = "x-request-id";

export type ApiEnv = {
  Variables: {
    requestId: string;
  };
};

export class RequestValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(error: z.ZodError) {
    super("Request validation failed");
    this.name = "RequestValidationError";
    this.issues = error.issues;
  }
}

function getRequestId(context: Context<ApiEnv>): string {
  return context.get("requestId");
}

function fieldErrors(issues: z.ZodIssue[]): Record<string, string[]> {
  return issues.reduce<Record<string, string[]>>((errors, issue) => {
    const path = issue.path.length === 0 ? "_root" : issue.path.join(".");
    (errors[path] ??= []).push(issue.message);
    return errors;
  }, {});
}

function issueDetails(issues: z.ZodIssue[]) {
  return {
    issues: issues.map(({ code, path, message }) => ({ code, path, message })),
  };
}

function envelope(
  context: Context,
  code: ApiErrorCode,
  message: string,
  options: { issues?: z.ZodIssue[]; details?: Record<string, unknown> } = {},
): ApiErrorEnvelope {
  const issues = options.issues;
  const payload = {
    error: {
      code,
      message,
      ...(issues ? { fieldErrors: fieldErrors(issues) } : {}),
      requestId: getRequestId(context),
      details: issues ? issueDetails(issues) : (options.details ?? {}),
    },
  } satisfies ApiErrorEnvelope;
  return apiErrorEnvelopeSchema.parse(payload);
}

export function apiErrorMiddleware(): MiddlewareHandler<ApiEnv> {
  return async (context, next) => {
    const requestId = context.req.header(requestIdHeader) ?? crypto.randomUUID();
    context.set("requestId", requestId);
    context.header(requestIdHeader, requestId);
    try {
      await next();
    } catch (error) {
      return handleApiError(
        error instanceof Error ? error : new Error("Unknown server error"),
        context,
      );
    }
  };
}

export function handleApiError(error: Error, context: Context<ApiEnv>): Response {
  if (error instanceof RequestValidationError || error instanceof z.ZodError) {
    const issues = error.issues;
    return context.json(
      envelope(context, "VALIDATION_ERROR", "Request validation failed", { issues }),
      400,
    );
  }

  if (error instanceof HTTPException) {
    return context.json(
      envelope(
        context,
        error.status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        error.status === 404
          ? "The requested resource was not found"
          : "An unexpected error occurred",
      ),
      error.status,
    );
  }

  return context.json(
    envelope(context, "INTERNAL_SERVER_ERROR", "An unexpected error occurred"),
    500,
  );
}

export function notFoundResponse(context: Context<ApiEnv>): Response {
  return context.json(envelope(context, "NOT_FOUND", "The requested resource was not found"), 404);
}
