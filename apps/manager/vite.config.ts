import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import react from "@vitejs/plugin-react";
import { ENV } from "varlock/env";
import { defineConfig } from "vite";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [varlockVitePlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(directory, "./src"),
    },
  },
  server: {
    port: ENV.MANAGER_PORT,
    strictPort: true,
  },
});
