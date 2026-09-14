import { type LogData, type LogLevel } from "@repo/utils";
import { tryGetContext } from "hono/context-storage";
import { ENV } from "varlock/env";
import winston from "winston";
import LokiTransport from "winston-loki";

import rootPackageJson from "../../../../package.json" with { type: "json" };
import packageJson from "../../package.json" with { type: "json" };

const appLabel = `${rootPackageJson.name}-${packageJson.name}`;

const addRequestContext = winston.format((info) => {
  const context = tryGetContext();

  if (!context) return info;

  info.requestId ??= context.var.requestId;
  info.method ??= context.req.method;
  info.path ??= context.req.path;
  info.userId ??= context.var.user?.id;

  return info;
});

const isDev = ENV.APP_ENV === "development";

type MyLogger = {
  debug(message: string, meta?: LogData): void;
  info(message: string, meta?: LogData): void;
  warn(message: string, meta?: LogData): void;
  error(message: string, meta?: LogData): void;
  log({ level, message, ...meta }: { level: LogLevel; message: string } & LogData): void;
};

export const logger: MyLogger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    addRequestContext(),
    winston.format.json(),
  ),
  defaultMeta: {
    app: appLabel,
    environment: ENV.APP_ENV,
    version: packageJson.version,
  },
  transports: [
    ...(isDev || !ENV.LOKI_HOST
      ? [
          new winston.transports.Console({
            level: isDev ? "debug" : "warn",
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          }),
        ]
      : []),
    ...(ENV.LOKI_HOST && ENV.APP_ENV !== "test"
      ? [
          new LokiTransport({
            host: ENV.LOKI_HOST,
            json: true,
            labels: {
              app: appLabel,
              environment: ENV.APP_ENV,
            },
          }),
        ]
      : []),
  ],
});
