import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/ui", () => ({
  CardHealth: () => <div>Checking API health</div>,
  Logo: () => <div>Competition Manager logo</div>,
}));

vi.mock("@repo/utils", () => ({
  APP_NAME: "competition-manager-v2",
}));

vi.mock("varlock/env", () => ({
  ENV: { APP_ENV: "test" },
}));

vi.mock("@/hooks/use-api-health", () => ({
  useAPIHealth: () => ({
    isError: false,
    isPending: true,
    refetch: vi.fn(),
  }),
}));

import { Route } from "@/routes/index";

describe("manager app", () => {
  it("starts with the frontend landing experience", () => {
    const Index = Route.options.component as ComponentType;
    const markup = renderToStaticMarkup(<Index />);

    expect(markup).toContain("Competition Manager logo");
    expect(markup).toContain("Welcome to competition-manager-v2");
    expect(markup).toContain("Environment: test");
    expect(markup).toContain("Checking API health");
  });
});
