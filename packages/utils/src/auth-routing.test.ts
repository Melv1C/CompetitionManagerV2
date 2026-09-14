import { describe, expect, it } from "vitest";

import { getAuthRedirect } from "./auth-routing";

describe("getAuthRedirect", () => {
  const frontendAuthPaths = ["/login", "/sign-up"];

  it("sends signed-out visitors to login from protected pages", () => {
    expect(getAuthRedirect("/", false, frontendAuthPaths)).toBe("/login");
  });

  it("allows signed-out visitors to use login and sign-up", () => {
    expect(getAuthRedirect("/login", false, frontendAuthPaths)).toBeNull();
    expect(getAuthRedirect("/sign-up", false, frontendAuthPaths)).toBeNull();
  });

  it("keeps signed-in visitors out of auth pages", () => {
    expect(getAuthRedirect("/login", true, frontendAuthPaths)).toBe("/");
    expect(getAuthRedirect("/sign-up", true, frontendAuthPaths)).toBe("/");
  });

  it("allows signed-in visitors to use protected pages", () => {
    expect(getAuthRedirect("/", true, frontendAuthPaths)).toBeNull();
  });
});
