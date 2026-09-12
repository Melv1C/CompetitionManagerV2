import { describe, expect, it } from "vitest";

import { createClubClient } from "./clubs";

const result = {
  club: {
    id: "club-1",
    name: "Brussels Athletics Club",
    createdAt: "2026-09-12T20:00:00.000Z",
    updatedAt: "2026-09-12T20:00:00.000Z",
  },
  membership: {
    id: "membership-1",
    clubId: "club-1",
    userId: "user-1",
    role: "manager",
    createdAt: "2026-09-12T20:00:00.000Z",
  },
};

describe("createClubClient", () => {
  it("uses credentialed typed requests and sends an idempotency key", async () => {
    const requests: Request[] = [];
    const client = createClubClient("http://localhost:3000/", async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.method === "POST") return new Response(JSON.stringify(result), { status: 201 });
      return new Response(JSON.stringify({ clubs: [result] }), { status: 200 });
    });

    await expect(
      client.createClub({ name: "Brussels Athletics Club" }, "retry-key"),
    ).resolves.toEqual(result);
    await expect(client.listClubs()).resolves.toEqual({ clubs: [result] });

    expect(requests[0]!.url).toBe("http://localhost:3000/api/v1/clubs");
    expect(requests[0]!.credentials).toBe("include");
    expect(requests[0]!.headers.get("Idempotency-Key")).toBe("retry-key");
    expect(await requests[0]!.json()).toEqual({ name: "Brussels Athletics Club" });
  });

  it("retrieves one Club by its manager-scoped identifier", async () => {
    const client = createClubClient("http://localhost:3000", async (input) => {
      const url = input instanceof Request ? input.url : input.toString();
      expect(url).toBe("http://localhost:3000/api/v1/clubs/club-1");
      return new Response(JSON.stringify(result), { status: 200 });
    });

    await expect(client.getClub("club-1")).resolves.toEqual(result);
  });
});
