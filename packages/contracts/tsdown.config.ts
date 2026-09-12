import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: {
    errors: "./src/errors.ts",
    health: "./src/health.ts",
    index: "./src/index.ts",
    jobs: "./src/jobs.ts",
    openapi: "./src/openapi.ts",
  },
  fixedExtension: true,
});
