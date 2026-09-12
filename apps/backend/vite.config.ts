import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite-plus";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(directory, "./src"),
    },
  },
  pack: {
    entry: {
      index: "./src/index.ts",
      worker: "./src/worker.ts",
    },
    exports: true,
  },
});
