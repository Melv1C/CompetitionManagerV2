import { describe, expect, it } from "vitest";

import { AuthClientError, createSessionClient } from "./auth";

const session = {
  session: {
    id: "session-id",
    expiresAt: "2026-09-13T00:00:00.000Z",
    token: "session-token",
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
    userId: "user-id",
  },
  user: {
    id: "user-id",
    name: "Test User",
    email: "user@example.test",
    emailVerified: false,
    image: null,
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
};

describe("createSessionClient", () => {
  it("uses credentialed requests and returns the typed current session", async () => {
    const requests: Request[] = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return new Response(JSON.stringify(requests.length === 1 ? {} : session), { status: 200 });
    };

    const client = createSessionClient("http://localhost:3000/", fetcher);
    const result = await client.signIn({ email: "user@example.test", password: "password" });

    expect(result).toMatchObject({ user: { email: "user@example.test" } });
    expect(requests.map((request) => request.url)).toEqual([
      "http://localhost:3000/api/auth/sign-in/email",
      "http://localhost:3000/api/auth/get-session",
    ]);
    expect(requests[0]!.credentials).toBe("include");
    expect(await requests[0]!.json()).toEqual({
      email: "user@example.test",
      password: "password",
    });
  });

  it("preserves Better Auth error codes for callers", async () => {
    const client = createSessionClient(
      "http://localhost:3000",
      async () =>
        new Response(
          JSON.stringify({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid credentials" }),
          {
            status: 401,
          },
        ),
    );

    await expect(
      client.signIn({ email: "user@example.test", password: "wrong" }),
    ).rejects.toMatchObject(
      new AuthClientError("Invalid credentials", 401, "INVALID_EMAIL_OR_PASSWORD"),
    );
  });
});
