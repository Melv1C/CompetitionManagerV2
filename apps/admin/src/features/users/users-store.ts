import { type UserRole } from "@repo/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SortDirection = "asc" | "desc";
export type SortField = "name" | "email" | "createdAt";

export interface UsersFilter {
  searchValue: string;
  searchField: "email" | "name";
  role: UserRole | null;
  banned: boolean | null;
  limit: number;
  offset: number;
  sortBy: SortField;
  sortDirection: SortDirection;
}

interface UsersState {
  filter: UsersFilter;
  selectedUserId: string | null;
  sheetOpen: boolean;

  // Modal states
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  setPasswordDialogOpen: boolean;
  banDialogOpen: boolean;
  deleteDialogOpen: boolean;
  sessionsDialogOpen: boolean;

  // Actions
  setFilter: (filter: Partial<UsersFilter>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;

  setSelectedUserId: (id: string | null) => void;
  setSheetOpen: (open: boolean) => void;

  openCreateDialog: () => void;
  closeCreateDialog: () => void;

  openEditDialog: (userId: string) => void;
  closeEditDialog: () => void;

  openSetPasswordDialog: (userId: string) => void;
  closeSetPasswordDialog: () => void;

  openBanDialog: (userId: string) => void;
  closeBanDialog: () => void;

  openDeleteDialog: (userId: string) => void;
  closeDeleteDialog: () => void;

  openSessionsDialog: (userId: string) => void;
  closeSessionsDialog: () => void;
}

const DEFAULT_PAGE_SIZE = 10;

const initialFilter: UsersFilter = {
  searchValue: "",
  searchField: "email",
  role: null,
  banned: null,
  limit: DEFAULT_PAGE_SIZE,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc",
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      filter: initialFilter,
      selectedUserId: null,
      sheetOpen: false,

      createDialogOpen: false,
      editDialogOpen: false,
      setPasswordDialogOpen: false,
      banDialogOpen: false,
      deleteDialogOpen: false,
      sessionsDialogOpen: false,

      setFilter: (updates) =>
        set((state) => ({
          filter: {
            ...state.filter,
            ...updates,
            offset: updates.offset ?? 0,
          },
        })),

      resetFilters: () =>
        set((state) => ({
          filter: { ...initialFilter, limit: state.filter.limit },
        })),

      setPage: (page) =>
        set((state) => ({
          filter: {
            ...state.filter,
            offset: page * state.filter.limit,
          },
        })),

      setSelectedUserId: (id) => set({ selectedUserId: id }),
      setSheetOpen: (open) =>
        set((state) => ({
          sheetOpen: open,
          selectedUserId: open ? state.selectedUserId : null,
        })),

      openCreateDialog: () => set({ createDialogOpen: true }),
      closeCreateDialog: () => set({ createDialogOpen: false }),

      openEditDialog: (userId) =>
        set({
          selectedUserId: userId,
          editDialogOpen: true,
        }),
      closeEditDialog: () =>
        set({
          editDialogOpen: false,
        }),

      openSetPasswordDialog: (userId) =>
        set({
          selectedUserId: userId,
          setPasswordDialogOpen: true,
        }),
      closeSetPasswordDialog: () =>
        set({
          setPasswordDialogOpen: false,
        }),

      openBanDialog: (userId) =>
        set({
          selectedUserId: userId,
          banDialogOpen: true,
        }),
      closeBanDialog: () =>
        set({
          banDialogOpen: false,
        }),

      openDeleteDialog: (userId) =>
        set({
          selectedUserId: userId,
          deleteDialogOpen: true,
        }),
      closeDeleteDialog: () =>
        set({
          deleteDialogOpen: false,
        }),

      openSessionsDialog: (userId) =>
        set({
          selectedUserId: userId,
          sessionsDialogOpen: true,
        }),
      closeSessionsDialog: () =>
        set({
          sessionsDialogOpen: false,
        }),
    }),
    {
      name: "users-store",
      partialize: (state) => ({
        filter: {
          limit: state.filter.limit,
          sortBy: state.filter.sortBy,
          sortDirection: state.filter.sortDirection,
          searchField: state.filter.searchField,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UsersState>;
        return {
          ...currentState,
          filter: {
            ...initialFilter,
            ...persisted?.filter,
          },
        };
      },
    },
  ),
);
