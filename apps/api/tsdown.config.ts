import { defineConfig } from "tsdown";

export default defineConfig({
  alias: {
    "@": "./src",
  },
  dts: true,
  entry: "./src/index.ts",
  fixedExtension: true,
});
