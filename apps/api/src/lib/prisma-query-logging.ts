type PrismaQueryEvent = {
  duration: number;
  params: string;
  query: string;
  target: string;
};

export const prismaQueryLogConfig = [{ emit: "event", level: "query" }] as const;

const getQueryOperation = (query: string) =>
  query.match(/^\s*(DELETE|INSERT|MERGE|SELECT|UPDATE|WITH)\b/i)?.[1]?.toUpperCase() ?? "OTHER";

export const getPrismaQueryMetadata = (
  { duration, params, query, target }: PrismaQueryEvent,
  appEnv: string,
) => ({
  durationMs: duration,
  operation: getQueryOperation(query),
  target,
  ...(appEnv === "development" ? { params, query } : {}),
});
