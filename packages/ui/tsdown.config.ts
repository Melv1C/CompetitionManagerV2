import { defineConfig } from "tsdown";

export default defineConfig({
  exports: {
    customExports: {
      "./index.css": "./index.css",
    },
  },
});
