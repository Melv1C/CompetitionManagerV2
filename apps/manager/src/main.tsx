import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppShell } from "@competition-manager/ui";
import "@competition-manager/ui/app-shell.css";

const backendUrl = String(import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell surface="manager" backendUrl={backendUrl} />
  </StrictMode>,
);
