import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import react from "@vitejs/plugin-react";
import { ENV } from "varlock/env";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [varlockVitePlugin(), react(), tailwindcss()],
  server: {
    port: ENV.MANAGER_PORT,
    strictPort: true,
  },
});
