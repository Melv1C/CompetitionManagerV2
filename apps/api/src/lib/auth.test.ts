import { admin } from "better-auth/plugins";
import { describe, expect, it } from "vitest";

import {
  auth,
  createVerificationLink,
  getTrustedOrigins,
  isVerifiedUser,
  requireAuthSecret,
} from "./auth";

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

  it("enables email/password sessions without silently treating an email as verified", () => {
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      requireEmailVerification: false,
    });
    expect(auth.options.emailVerification).toMatchObject({
      sendOnSignIn: true,
      sendOnSignUp: true,
    });
  });

  it("requires a secret in production and staging before Better Auth starts", () => {
    expect(() => requireAuthSecret("production", undefined)).toThrow(
      "BETTER_AUTH_SECRET is required in production and staging",
    );
    expect(() => requireAuthSecret("staging", "")).toThrow(
      "BETTER_AUTH_SECRET is required in production and staging",
    );
    expect(requireAuthSecret("development", undefined)).toBeUndefined();
  });

  it("uses the exact configured origins for deployed surfaces", () => {
    expect(
      getTrustedOrigins({
        APP_ENV: "production",
        BACKEND_URL: "https://api.example.test",
        FRONTEND_URL: "https://frontend.example.test",
        MANAGER_URL: "https://manager.example.test",
        ADMIN_URL: "https://admin.example.test",
      }),
    ).toEqual([
      "https://api.example.test",
      "https://frontend.example.test",
      "https://manager.example.test",
      "https://admin.example.test",
    ]);
  });

  it("keeps email verification as the explicit sensitive-action gate", () => {
    expect(isVerifiedUser({ emailVerified: false })).toBe(false);
    expect(isVerifiedUser({ emailVerified: true })).toBe(true);
  });

  it("makes verification links one-time and JSON-oriented", () => {
    const first = createVerificationLink({
      url: "http://localhost:3000/api/auth/verify-email?token=signed-token&callbackURL=%2F",
      token: "signed-token",
    });
    const second = createVerificationLink({
      url: "http://localhost:3000/api/auth/verify-email?token=signed-token&callbackURL=%2F",
      token: "signed-token",
    });

    expect(first.url).not.toBe(second.url);
    expect(new URL(first.url).searchParams.get("callbackURL")).toBeNull();
    expect(new URL(first.url).searchParams.get("verification")).toBeTruthy();
    expect(first.token).not.toBe(second.token);
    expect(first.token).toContain("signed-token");
  });
});
