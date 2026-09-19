import { describe, expect, it } from "vitest";

import { getManagerAuthRedirect } from "./auth-routing";

describe("getManagerAuthRedirect", () => {
  it("sends signed-out visitors to login", () => {
    expect(getManagerAuthRedirect("/", false, false)).toBe("/login");
  });

  it("allows signed-in organization members into the manager app", () => {
    expect(getManagerAuthRedirect("/", true, true)).toBeNull();
  });

  it("rejects signed-in users without an organization", () => {
    expect(getManagerAuthRedirect("/", true, false)).toBe("/unauthorized");
  });

  it("keeps signed-in users out of the login page", () => {
    expect(getManagerAuthRedirect("/login", true, true)).toBe("/");
  });

  it("keeps the access explanation public", () => {
    expect(getManagerAuthRedirect("/unauthorized", false, false)).toBeNull();
  });
});
