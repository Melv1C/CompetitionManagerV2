import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { useUsersStore as useUsersStoreType } from "./users-store";

const storage = new Map<string, string>();
let useUsersStore: typeof useUsersStoreType;

describe("users store", () => {
  beforeAll(async () => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
    ({ useUsersStore } = await import("./users-store"));
  });

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.clear();
    useUsersStore.setState(useUsersStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resets pagination when filters change without an explicit offset", () => {
    useUsersStore.getState().setFilter({ offset: 30, limit: 10 });
    useUsersStore.getState().setFilter({ searchValue: "jane" });

    expect(useUsersStore.getState().filter).toMatchObject({
      searchValue: "jane",
      limit: 10,
      offset: 0,
    });
  });

  it("calculates offset from page and current limit", () => {
    useUsersStore.getState().setFilter({ limit: 25 });
    useUsersStore.getState().setPage(2);

    expect(useUsersStore.getState().filter.offset).toBe(50);
  });

  it("selects users when opening targeted dialogs", () => {
    useUsersStore.getState().openEditDialog("user-1");
    expect(useUsersStore.getState()).toMatchObject({
      selectedUserId: "user-1",
      editDialogOpen: true,
    });

    useUsersStore.getState().closeEditDialog();
    expect(useUsersStore.getState().editDialogOpen).toBe(false);
    expect(useUsersStore.getState().selectedUserId).toBe("user-1");
  });

  it("clears the selected user when the detail sheet closes", () => {
    useUsersStore.getState().setSelectedUserId("user-2");
    useUsersStore.getState().setSheetOpen(true);
    useUsersStore.getState().setSheetOpen(false);

    expect(useUsersStore.getState().sheetOpen).toBe(false);
    expect(useUsersStore.getState().selectedUserId).toBeNull();
  });
});
