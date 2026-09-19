import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/index";

describe("manager app", () => {
  it("explains how a User without an Organization gets access", () => {
    const Index = Route.options.component as ComponentType;
    const markup = renderToStaticMarkup(<Index />);

    expect(markup).toContain("No Organization available");
    expect(markup).toContain("Ask an Organization Owner to add this account");
  });
});
