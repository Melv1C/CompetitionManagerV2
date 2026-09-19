import { describe, expect, it } from "vitest";

import { getPrismaQueryLogConfig, getSafePrismaQueryMetadata } from "./prisma-query-logging";

describe("Prisma query logging", () => {
  it("enables query events only in development", () => {
    expect(getPrismaQueryLogConfig("development")).toEqual([{ emit: "event", level: "query" }]);
    expect(getPrismaQueryLogConfig("test")).toEqual([]);
    expect(getPrismaQueryLogConfig("staging")).toEqual([]);
    expect(getPrismaQueryLogConfig("production")).toEqual([]);
  });

  it("keeps query text and parameters out of metadata", () => {
    const metadata = getSafePrismaQueryMetadata({
      duration: 12,
      params: '["private@example.com"]',
      query: 'SELECT * FROM "User" WHERE "email" = $1',
      target: "quaint::connector::metrics",
    });

    expect(metadata).toEqual({ durationMs: 12 });
    expect(JSON.stringify(metadata)).not.toContain("private@example.com");
    expect(JSON.stringify(metadata)).not.toContain("SELECT");
  });
});
