import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";

import { getSession, getUser } from "./auth-utils";

function createContext(values: Record<string, unknown>) {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

describe("auth utils", () => {
  it("returns session and user from Hono context", () => {
    const session = { id: "session-1" };
    const user = { id: "user-1", role: "admin" };
    const context = createContext({ session, user }) as unknown as Context;

    expect(getSession(context)).toBe(session);
    expect(getUser(context)).toBe(user);
  });

  it("throws clear errors when auth data is missing", () => {
    const context = createContext({}) as unknown as Context;

    expect(() => getSession(context)).toThrow("Session not found in context");
    expect(() => getUser(context)).toThrow("User not found in context");
  });
});
