import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../src/infrastructure/database";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://competition:competition@localhost:5432/competition_manager";
const database = createDatabaseClient(databaseUrl);

describe("identity and tenancy database foundation", () => {
  beforeAll(async () => {
    await database.$connect();
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("has an applied migration containing the Better Auth and tenancy tables", async () => {
    const migrations = await database.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    const tables = await database.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    expect(migrations.map(({ migration_name }) => migration_name)).toContain(
      "20260912111500_identity_tenancy_foundation",
    );
    expect(tables.map(({ table_name }) => table_name)).toEqual(
      expect.arrayContaining([
        "user",
        "account",
        "session",
        "verification",
        "Organization",
        "OrganizationMembership",
      ]),
    );
  });

  it("rejects duplicate identity email and organization membership records", async () => {
    const suffix = crypto.randomUUID();
    const email = `identity-test-${suffix}@example.test`;
    const slug = `identity-test-${suffix}`;
    const user = await database.user.create({
      data: { name: "Identity Test User", email },
    });
    const organization = await database.organization.create({
      data: { name: "Identity Test Organization", slug },
    });

    try {
      await expect(
        database.user.create({
          data: { name: "Duplicate Identity", email },
        }),
      ).rejects.toMatchObject({ code: "P2002" });

      await database.organizationMembership.create({
        data: { organizationId: organization.id, userId: user.id, role: "owner" },
      });

      await expect(
        database.organizationMembership.create({
          data: { organizationId: organization.id, userId: user.id, role: "viewer" },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await database.organization.delete({ where: { id: organization.id } });
      await database.user.delete({ where: { id: user.id } });
    }
  });
});
