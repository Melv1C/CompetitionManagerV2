import { describe, expect, it } from "vitest";

import { auth } from "./auth";

describe("Better Auth configuration", () => {
  it("exposes the session API from the configured auth instance", () => {
    expect(auth.api.getSession).toBeTypeOf("function");
  });

  it("exposes the organization API from the configured organization plugin", () => {
    expect(auth.api.createOrganization).toBeTypeOf("function");
  });

  it("does not enable the optional Better Auth teams feature", () => {
    expect(auth.api.createTeam).toBeUndefined();
  });
});
