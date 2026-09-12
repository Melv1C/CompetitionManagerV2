import { defineConfig } from "tsdown";

export default defineConfig({
  alias: {
    "@": "./src",
  },
  dts: true,
  entry: {
    index: "./src/index.ts",
    worker: "./src/worker.ts",
  },
  fixedExtension: true,
});
