import { describe, expect, it } from "vitest";

import { getManagerAuthRedirect } from "./auth-routing";

describe("getManagerAuthRedirect", () => {
  it("sends signed-out visitors to login", () => {
    expect(getManagerAuthRedirect("/", false, false, false)).toBe("/login");
  });

  it("allows verified organization members into the manager app", () => {
    expect(getManagerAuthRedirect("/", true, true, true)).toBeNull();
  });

  it("rejects unverified organization members", () => {
    expect(getManagerAuthRedirect("/", true, false, true)).toBe("/unauthorized");
  });

  it("rejects signed-in users without an organization", () => {
    expect(getManagerAuthRedirect("/", true, true, false)).toBe("/unauthorized");
  });

  it("sends a verified organization member away from the login page", () => {
    expect(getManagerAuthRedirect("/login", true, true, true)).toBe("/");
  });

  it("sends an unverified user from login to the access explanation", () => {
    expect(getManagerAuthRedirect("/login", true, false, true)).toBe("/unauthorized");
  });

  it("keeps the access explanation public", () => {
    expect(getManagerAuthRedirect("/unauthorized", false, false, false)).toBeNull();
  });
});
