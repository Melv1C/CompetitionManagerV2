import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RuntimeDevtoolsPanel, createRuntimeSnapshot } from "./runtime-devtools";

let container: HTMLDivElement;
let root: Root;

function render(ui: ReactNode) {
  act(() => {
    root.render(ui);
  });
}

describe("RuntimeDevtoolsPanel", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("records the current product route", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);

    render(<RuntimeDevtoolsPanel application="Manager" path="/competitions/42" />);

    expect(container.textContent).toContain("Manager");
    expect(container.textContent).toContain("/competitions/42");
  });

  it("creates typed snapshots with their capture time", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);

    expect(createRuntimeSnapshot("Admin", "/users")).toEqual({
      application: "Admin",
      path: "/users",
      timestamp: 1_800_000_000_000,
    });
  });
});
