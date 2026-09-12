import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: {
    index: "./src/index.ts",
    worker: "./src/worker.ts",
  },
  fixedExtension: true,
});
