type PrismaQueryEvent = {
  duration: number;
  params: string;
  query: string;
  target: string;
};

type PrismaQueryLogDefinition = {
  emit: "event";
  level: "query";
};

export const getPrismaQueryLogConfig = (appEnv: string): PrismaQueryLogDefinition[] =>
  appEnv === "development" ? [{ emit: "event", level: "query" }] : [];

export const getSafePrismaQueryMetadata = ({ duration }: PrismaQueryEvent) => ({
  durationMs: duration,
});
