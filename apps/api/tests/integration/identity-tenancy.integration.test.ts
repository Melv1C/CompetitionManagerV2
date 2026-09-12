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
    const adminColumns = await database.$queryRaw<
      Array<{ table_name: string; column_name: string }>
    >`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('user', 'session')
    `;

    expect(migrations.map(({ migration_name }) => migration_name)).toContain(
      "20260912111500_identity_tenancy_foundation",
    );
    const tableNames = tables.map(({ table_name }) => table_name);
    expect(tableNames).toEqual(
      expect.arrayContaining([
        "user",
        "account",
        "session",
        "verification",
        "organization",
        "member",
        "invitation",
      ]),
    );
    expect(tableNames).not.toEqual(expect.arrayContaining(["admin", "team", "teamMember"]));

    const adminColumnNames = adminColumns.map(
      ({ table_name, column_name }) => `${table_name}.${column_name}`,
    );
    expect(adminColumnNames).toEqual(
      expect.arrayContaining([
        "user.role",
        "user.banned",
        "user.banReason",
        "user.banExpires",
        "session.impersonatedBy",
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
    expect(user.banned).toBe(false);
    const organization = await database.organization.create({
      data: { name: "Identity Test Organization", slug },
    });

    try {
      await expect(
        database.user.create({
          data: { name: "Duplicate Identity", email },
        }),
      ).rejects.toMatchObject({ code: "P2002" });

      await database.member.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organization.id,
          userId: user.id,
          role: "owner",
          createdAt: new Date(),
        },
      });

      await expect(
        database.member.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: organization.id,
            userId: user.id,
            role: "member",
            createdAt: new Date(),
          },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await database.organization.delete({ where: { id: organization.id } });
      await database.user.delete({ where: { id: user.id } });
    }
  });
});
