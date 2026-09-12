import { defineConfig } from "tsdown";

export default defineConfig({
  alias: {
    "@": "./src",
  },
  dts: true,
  fixedExtension: true,
});
