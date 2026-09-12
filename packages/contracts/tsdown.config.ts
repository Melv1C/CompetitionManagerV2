import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: {
    health: "./src/health.ts",
    index: "./src/index.ts",
  },
  fixedExtension: true,
});
