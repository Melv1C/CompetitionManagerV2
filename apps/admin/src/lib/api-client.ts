import type { AppType } from "backend";
import { hc } from "hono/client";
import { ENV } from "varlock/env";

export const apiClient = hc<AppType>(ENV.BACKEND_URL, {
  init: {
    credentials: "include",
  },
});
