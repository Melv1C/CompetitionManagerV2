import { AppShell } from "@competition-manager/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ENV } from "varlock/env";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell surface="admin" backendUrl={ENV.BACKEND_URL} />
  </StrictMode>,
);
