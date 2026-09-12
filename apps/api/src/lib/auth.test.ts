import { admin } from "better-auth/plugins";
import { describe, expect, it } from "vitest";

import { auth } from "./auth";

describe("Better Auth configuration", () => {
  it("exposes the session API from the configured auth instance", () => {
    expect(auth.api.getSession).toBeTypeOf("function");
  });

  it("exposes the organization API from the configured organization plugin", () => {
    expect(auth.api.createOrganization).toBeTypeOf("function");
  });

  it("exposes the admin API from the configured admin plugin", () => {
    expect(auth.api.listUsers).toBeTypeOf("function");
    expect(auth.api.setRole).toBeTypeOf("function");
    expect(auth.options.plugins?.some((plugin) => plugin.id === "admin")).toBe(true);
  });

  it("keeps Better Auth's documented default user role", async () => {
    const result = await admin().init().options.databaseHooks.user.create.before({
      id: "user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "user@example.test",
      emailVerified: false,
      name: "User",
      image: null,
    });

    expect(result.data.role).toBe("user");
  });

  it("does not enable the optional Better Auth teams feature", () => {
    expect(auth.api.createTeam).toBeUndefined();
  });
});
