import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiApp } from "../../src/app";
import { database } from "../../src/infrastructure/database";

type TestUser = { id: string; email: string; emailVerified: boolean };

function appFor(user: TestUser | null) {
  return createApiApp({
    sessionResolver: async () => (user ? ({ user: { ...user } } as never) : null),
  });
}

describe("Club manager API", () => {
  const users: TestUser[] = [];
  const clubs: string[] = [];

  beforeAll(async () => {
    await database.$connect();
    for (const [name, emailVerified] of [
      ["Club Manager", true],
      ["Second Club User", true],
      ["Unverified Club User", false],
    ] as const) {
      const email = `clubs-${crypto.randomUUID()}@example.test`;
      const created = await database.user.create({ data: { name, email, emailVerified } });
      users.push({ id: created.id, email, emailVerified });
    }
  });

  afterAll(async () => {
    await database.club.deleteMany({ where: { id: { in: clubs } } });
    await database.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } });
    await database.$disconnect();
  });

  it("denies anonymous and unverified Club access", async () => {
    const anonymous = await appFor(null).request("http://localhost:3000/api/v1/clubs");
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });

    const unverified = await appFor(users[2]!).request("http://localhost:3000/api/v1/clubs");
    expect(unverified.status).toBe(403);
    expect(await unverified.json()).toMatchObject({ error: { code: "EMAIL_NOT_VERIFIED" } });
  });

  it("rejects an invalid Club profile with field-level errors", async () => {
    const response = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "invalid-club" },
      body: JSON.stringify({ name: " " }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { name: expect.any(Array) } },
    });
  });

  it("keeps Club independent from Organization at the persistence boundary", async () => {
    const columns = await database.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'club'
    `;
    expect(columns.map(({ column_name }) => column_name)).not.toContain("organizationId");
  });

  it("creates an atomic Club and initial manager membership", async () => {
    const key = `create-${crypto.randomUUID()}`;
    const response = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ name: "Brussels Athletics Club" }),
    });
    expect(response.status).toBe(201);
    const result = await response.json();
    clubs.push(result.club.id);
    expect(result).toMatchObject({
      club: { name: "Brussels Athletics Club" },
      membership: { userId: users[0]!.id, role: "manager" },
    });

    const list = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs");
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ clubs: [{ club: { id: result.club.id } }] });

    const retrieved = await appFor(users[0]!).request(
      `http://localhost:3000/api/v1/clubs/${result.club.id}`,
    );
    expect(retrieved.status).toBe(200);
    expect(await retrieved.json()).toMatchObject(result);
    await expect(
      database.clubMembership.count({ where: { clubId: result.club.id } }),
    ).resolves.toBe(1);
  });

  it("returns the existing Club for a same-key retry and rejects a changed request", async () => {
    const key = `retry-${crypto.randomUUID()}`;
    const first = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ name: "Retry Safe Club" }),
    });
    const firstResult = await first.json();
    clubs.push(firstResult.club.id);

    const retry = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ name: "Retry Safe Club" }),
    });
    expect(retry.status).toBe(201);
    expect(await retry.json()).toEqual(firstResult);
    await expect(
      database.clubMembership.count({ where: { clubId: firstResult.club.id } }),
    ).resolves.toBe(1);

    const changed = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ name: "A Different Club" }),
    });
    expect(changed.status).toBe(409);
    expect(await changed.json()).toMatchObject({
      error: { code: "IDEMPOTENCY_KEY_REUSED" },
    });

    const concurrentKey = `concurrent-${crypto.randomUUID()}`;
    const requests = await Promise.all(
      ["Concurrent Club", "Concurrent Club"].map(async (name) =>
        appFor(users[0]!).request("http://localhost:3000/api/v1/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": concurrentKey },
          body: JSON.stringify({ name }),
        }),
      ),
    );
    const concurrentResults = await Promise.all(requests.map((request) => request.json()));
    expect(requests.map((request) => request.status)).toEqual([201, 201]);
    expect(concurrentResults[0]).toEqual(concurrentResults[1]);
    clubs.push(concurrentResults[0].club.id);
    await expect(
      database.clubMembership.count({ where: { clubId: concurrentResults[0].club.id } }),
    ).resolves.toBe(1);
  });

  it("does not disclose a Club to another verified user", async () => {
    const ownClubs = await appFor(users[0]!).request("http://localhost:3000/api/v1/clubs");
    const ownResult = await ownClubs.json();
    const clubId = ownResult.clubs[0].club.id;

    const otherList = await appFor(users[1]!).request("http://localhost:3000/api/v1/clubs");
    expect(await otherList.json()).toEqual({ clubs: [] });
    const otherClub = await appFor(users[1]!).request(
      `http://localhost:3000/api/v1/clubs/${clubId}`,
    );
    expect(otherClub.status).toBe(404);
    expect(await otherClub.json()).toMatchObject({ error: { code: "CLUB_NOT_FOUND" } });
  });
});
