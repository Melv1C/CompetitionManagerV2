import { describe, expect, it } from "vitest";

import { auth } from "./auth";

describe("Better Auth configuration", () => {
  it("exposes the session API from the configured auth instance", () => {
    expect(auth.api.getSession).toBeTypeOf("function");
  });
});
