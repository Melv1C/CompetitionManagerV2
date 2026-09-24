import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createAthleteImportService } from "./service";
import type { LrbaAthleteRow, LrbaSeasonDefinition } from "./types";

const row: LrbaAthleteRow = {
  sourceRow: 2,
  license: "1234567",
  bib: 42,
  firstName: "Ada",
  lastName: "Lovelace",
  gender: "F",
  birthDate: "2000-01-02",
  clubExternalId: "123",
  clubAbbreviation: "CAB",
};

const season: LrbaSeasonDefinition = {
  code: "2027",
  startsOn: "2026-11-01",
  endsOn: "2027-10-31",
  label: "2026–2027",
};

function createDatabaseMock() {
  return {
    athleticsSeason: { findUnique: vi.fn().mockResolvedValue(null) },
    athleteExternalIdentity: { findMany: vi.fn().mockResolvedValue([]) },
    club: { findMany: vi.fn().mockResolvedValue([]) },
    athleteImportBatch: {
      create: vi
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: crypto.randomUUID(), ...data })),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    athleteImportRow: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    athleteImportClub: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn(),
  };
}

describe("athlete import service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recomputes a new preview when the same export is uploaded again", async () => {
    const db = createDatabaseMock();
    db.athleteExternalIdentity.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        externalId: row.license,
        athlete: {
          firstName: row.firstName,
          lastName: row.lastName,
          gender: row.gender,
          birthDate: new Date(`${row.birthDate}T00:00:00.000Z`),
          seasons: [],
        },
      },
    ]);
    db.club.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "club-123",
        externalId: row.clubExternalId,
        abbreviation: row.clubAbbreviation,
        active: true,
      },
    ]);
    const service = createAthleteImportService({ db: db as never });
    const input = {
      filename: "athletes.csv",
      checksum: "same-checksum",
      season,
      rows: [row],
      createdByUserId: "admin-1",
    };

    await service.preview(input);
    await service.preview(input);

    expect(db.athleteImportBatch.create).toHaveBeenCalledTimes(2);
    expect(db.athleteImportBatch.create.mock.calls[0]?.[0].data.summary.athletesCreated).toBe(1);
    expect(db.athleteImportBatch.create.mock.calls[1]?.[0].data.summary).toMatchObject({
      athletesCreated: 0,
      athletesUnchanged: 1,
      clubsCreated: 0,
      clubsUnchanged: 1,
    });
  });

  it("persists the dispatch ID before enqueueing a confirmed import", async () => {
    const db = createDatabaseMock();
    const previewBatch = {
      id: "batch-1",
      state: "PREVIEW",
      checksum: "checksum-1",
      provider: "LRBA",
      seasonCode: season.code,
      workerJobId: null,
    };
    const queuedBatch = {
      ...previewBatch,
      state: "QUEUED",
      workerJobId: "athlete-import-dispatch-1",
    };
    db.athleteImportBatch.findUnique
      .mockResolvedValueOnce(previewBatch)
      .mockResolvedValueOnce(queuedBatch);
    let dispatchPersisted = false;
    db.$transaction.mockImplementation(async (callback) => {
      db.athleteImportBatch.update.mockImplementationOnce(async ({ data }) => {
        dispatchPersisted = data.workerJobId === "athlete-import-dispatch-1";
        return data;
      });
      return callback(db);
    });
    const enqueue = vi.fn().mockImplementation(async () => {
      expect(dispatchPersisted).toBe(true);
      return "athlete-import-dispatch-1";
    });
    const service = createAthleteImportService({
      db: db as never,
      createWorkerJobId: () => "athlete-import-dispatch-1",
    });

    await service.confirm({
      batchId: previewBatch.id,
      checksum: previewBatch.checksum,
      rows: [row],
      enqueue,
    });

    expect(enqueue).toHaveBeenCalledWith(previewBatch.id, "athlete-import-dispatch-1");
    expect(dispatchPersisted).toBe(true);
  });

  it("uses an extended transaction timeout for chunked import staging", async () => {
    const db = createDatabaseMock();
    const previewBatch = {
      id: "batch-1",
      state: "PREVIEW",
      checksum: "checksum-1",
      provider: "LRBA",
      seasonCode: season.code,
      workerJobId: null,
    };
    db.athleteImportBatch.findUnique.mockResolvedValueOnce(previewBatch);
    db.$transaction.mockImplementation(async (callback) => callback(db));
    const rows = Array.from({ length: 751 }, (_, index) => ({
      ...row,
      sourceRow: index + 2,
      license: String(1_234_567 + index),
    }));
    const service = createAthleteImportService({
      db: db as never,
      createWorkerJobId: () => "athlete-import-dispatch-1",
    });

    await service.confirm({
      batchId: previewBatch.id,
      checksum: previewBatch.checksum,
      rows,
      enqueue: vi.fn().mockResolvedValue("athlete-import-dispatch-1"),
    });

    expect(db.athleteImportRow.createMany).toHaveBeenCalledTimes(2);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 60_000 });
  });

  it("re-enqueues every queued batch with its persisted job ID", async () => {
    const db = createDatabaseMock();
    db.athleteImportBatch.findMany.mockResolvedValue([
      { id: "batch-1", state: "QUEUED", workerJobId: "athlete-import-dispatch-1" },
      { id: "batch-2", state: "QUEUED", workerJobId: "athlete-import-dispatch-2" },
    ]);
    const enqueue = vi
      .fn()
      .mockResolvedValueOnce("athlete-import-dispatch-1")
      .mockRejectedValueOnce(new Error("Redis unavailable"));
    const service = createAthleteImportService({ db: db as never });

    const result = await service.reconcileQueuedImports(enqueue);

    expect(enqueue).toHaveBeenNthCalledWith(1, "batch-1", "athlete-import-dispatch-1");
    expect(enqueue).toHaveBeenNthCalledWith(2, "batch-2", "athlete-import-dispatch-2");
    expect(result).toMatchObject({ queued: 2, errors: [{ batchId: "batch-2" }] });
    expect(db.athleteImportBatch.updateMany).toHaveBeenCalledWith({
      where: { id: "batch-2", state: "QUEUED" },
      data: { errorMessage: "Waiting for job dispatch: Redis unavailable" },
    });
  });
});
