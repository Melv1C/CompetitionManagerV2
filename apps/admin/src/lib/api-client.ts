import type { AppType } from "api";
import { hc } from "hono/client";
import { ENV } from "varlock/env";

export const apiClient = hc<AppType>(ENV.API_URL, {
  init: {
    credentials: "include",
  },
});
