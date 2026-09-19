import { describe, expect, it } from "vitest";

import { getPrismaQueryMetadata, prismaQueryLogConfig } from "./prisma-query-logging";

describe("Prisma query logging", () => {
  const queryEvent = {
    duration: 12,
    params: '["private@example.com"]',
    query: 'SELECT * FROM "User" WHERE "email" = $1',
    target: "quaint::connector::metrics",
  };

  it("enables query events in every environment", () => {
    expect(prismaQueryLogConfig).toEqual([{ emit: "event", level: "query" }]);
  });

  it.each(["test", "staging", "production"])(
    "keeps query text and parameters out of %s metadata",
    (appEnv) => {
      const metadata = getPrismaQueryMetadata(queryEvent, appEnv);

      expect(metadata).toEqual({
        durationMs: 12,
        operation: "SELECT",
        target: "quaint::connector::metrics",
      });
      expect(metadata).not.toHaveProperty("params");
      expect(metadata).not.toHaveProperty("query");
      expect(JSON.stringify(metadata)).not.toContain("private@example.com");
    },
  );

  it("includes query text and parameters in development metadata", () => {
    expect(getPrismaQueryMetadata(queryEvent, "development")).toEqual({
      durationMs: 12,
      operation: "SELECT",
      params: '["private@example.com"]',
      query: 'SELECT * FROM "User" WHERE "email" = $1',
      target: "quaint::connector::metrics",
    });
  });

  it("does not copy unknown query text into the operation field", () => {
    const metadata = getPrismaQueryMetadata(
      { ...queryEvent, query: "private@example.com" },
      "production",
    );

    expect(metadata.operation).toBe("OTHER");
    expect(JSON.stringify(metadata)).not.toContain("private@example.com");
  });
});
